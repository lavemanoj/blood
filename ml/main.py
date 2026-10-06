from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
import math
import os

app = FastAPI(title="Blood Donor ML Service")

# Load models
BASE = os.path.dirname(__file__)
try:
    elig_model = joblib.load(os.path.join(BASE, 'models/eligibility_model.pkl'))
    avail_model = joblib.load(os.path.join(BASE, 'models/availability_model.pkl'))
    print("Models loaded successfully")
except Exception as e:
    print(f"Model load warning: {e}")
    elig_model = None
    avail_model = None

# Blood type compatibility map
COMPATIBLE = {
    'O-':  ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
    'O+':  ['A+','B+','AB+','O+'],
    'A-':  ['A+','A-','AB+','AB-'],
    'A+':  ['A+','AB+'],
    'B-':  ['B+','B-','AB+','AB-'],
    'B+':  ['B+','AB+'],
    'AB-': ['AB+','AB-'],
    'AB+': ['AB+']
}

def haversine(coord1, coord2):
    """Distance in km between two [lng, lat] coords."""
    R = 6371
    lng1, lat1 = math.radians(coord1[0]), math.radians(coord1[1])
    lng2, lat2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


# ─── Schemas ─────────────────────────────────────────────────────────────────

class EligibilityRequest(BaseModel):
    age_range: str
    weight_range: str
    recent_donation: str
    on_medication: str
    recent_illness: str
    chronic_condition: str
    alcohol_recent: str
    feeling_well: str

class DonorCandidate(BaseModel):
    donor_id: str
    blood_type: str
    location: List[float]           # [lng, lat]
    reliability_score: float
    total_donations: int
    days_since_last_donation: int
    priority_opt_in: bool
    is_available: bool

class MatchRequest(BaseModel):
    blood_type: str
    location: List[float]           # [lng, lat]
    urgency: str
    priority_mode: bool
    units: int
    donors: Optional[List[DonorCandidate]] = []
    max_distance_km: Optional[float] = 30.0


# ─── Helpers ─────────────────────────────────────────────────────────────────

AGE_MAP = {'Under 18': 16, '18-25': 21, '26-40': 33, '41-60': 50, 'Over 60': 65}
WEIGHT_MAP = {'Under 50kg': 45, '50-70kg': 60, '71-90kg': 80, 'Over 90kg': 95}
YES_NO = {'Yes': 1, 'No': 0, 'Not sure': 0}

def parse_eligibility(data: EligibilityRequest):
    return np.array([[
        AGE_MAP.get(data.age_range, 30),
        WEIGHT_MAP.get(data.weight_range, 65),
        YES_NO.get(data.recent_donation, 0),
        YES_NO.get(data.on_medication, 0),
        YES_NO.get(data.recent_illness, 0),
        YES_NO.get(data.chronic_condition, 0),
        YES_NO.get(data.alcohol_recent, 0),
        1 if data.feeling_well == 'Yes' else 0
    ]])


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": elig_model is not None}

@app.post("/eligibility")
def check_eligibility(data: EligibilityRequest):
    reasons = []
    score = 100

    age = AGE_MAP.get(data.age_range, 30)
    weight = WEIGHT_MAP.get(data.weight_range, 65)

    if age < 18 or age > 60:
        score -= 40; reasons.append("Age outside eligible range (18-60)")
    if weight < 50:
        score -= 30; reasons.append("Weight below minimum (50kg)")
    if data.recent_donation == 'Yes':
        score -= 30; reasons.append("Donated within last 3 months")
    if data.on_medication == 'Yes':
        score -= 20; reasons.append("Currently on medication")
    if data.recent_illness == 'Yes':
        score -= 25; reasons.append("Recent illness in last 2 weeks")
    if data.chronic_condition == 'Yes':
        score -= 20; reasons.append("Chronic health condition")
    if data.alcohol_recent == 'Yes':
        score -= 15; reasons.append("Alcohol consumed in last 24 hours")
    if data.feeling_well != 'Yes':
        score -= 20; reasons.append("Not feeling well today")

    # Use ML model if available
    if elig_model:
        features = parse_eligibility(data)
        ml_pred = elig_model.predict(features)[0]
        ml_proba = elig_model.predict_proba(features)[0][1]
        score = int(ml_proba * 100)
        eligible = bool(ml_pred)
    else:
        score = max(0, score)
        eligible = score >= 60

    return {"eligible": eligible, "score": score, "reasons": reasons}


@app.post("/match")
def match_donors(data: MatchRequest):
    compatible_types = [bt for bt, targets in COMPATIBLE.items() if data.blood_type in targets]

    matched_donors = []
    matched_hospitals = []  # hospital matching handled by backend geo query

    for donor in data.donors:
        if not donor.is_available:
            continue
        if donor.blood_type not in compatible_types:
            continue

        dist = haversine(data.location, donor.location)
        if dist > data.max_distance_km:
            continue

        # Availability score from ML
        if avail_model:
            features = np.array([[
                donor.total_donations,
                donor.reliability_score,
                donor.days_since_last_donation,
                int(donor.priority_opt_in),
                dist
            ]])
            avail_score = float(avail_model.predict(features)[0])
        else:
            avail_score = donor.reliability_score

        # Priority boost
        if data.priority_mode and donor.priority_opt_in:
            avail_score += 20

        # Urgency boost
        urgency_boost = {'critical': 30, 'urgent': 15, 'normal': 0}.get(data.urgency, 0)
        final_score = avail_score + urgency_boost - dist * 0.5

        matched_donors.append({
            "donor_id": donor.donor_id,
            "distance_km": round(dist, 2),
            "score": round(final_score, 2),
            "blood_type": donor.blood_type
        })

    # Sort by score descending
    matched_donors.sort(key=lambda x: x['score'], reverse=True)

    return {
        "matched_donors": [d["donor_id"] for d in matched_donors[:10]],
        "matched_hospitals": matched_hospitals,
        "ranked_donors": matched_donors[:10]
    }


# ─── Demand Prediction by Area ────────────────────────────────────────────────
# Grid-based geospatial technique:
# - Divide map into 0.1° x 0.1° grid cells (~11km x 11km)
# - Each cell identified by (round(lat,1), round(lng,1))
# - Count historical requests per cell per blood type
# - Apply time-series weight: recent requests weighted higher
# - Output: ranked list of high-demand areas with predicted blood type needs

class DemandRequest(BaseModel):
    historical_requests: List[dict]  # [{lat, lng, blood_type, created_at, status}]
    forecast_days: Optional[int] = 7

class AreaDemand(BaseModel):
    cell_lat: float
    cell_lng: float
    blood_type: str
    demand_score: float
    request_count: int
    fulfilled_count: int
    predicted_demand: int

@app.post("/demand-prediction")
def predict_demand(data: DemandRequest):
    from collections import defaultdict
    from datetime import datetime, timezone
    import math

    now = datetime.now(timezone.utc)
    grid = defaultdict(lambda: defaultdict(list))  # grid[cell][blood_type] = [requests]

    for req in data.historical_requests:
        try:
            lat = round(float(req.get('lat', 0)), 1)
            lng = round(float(req.get('lng', 0)), 1)
            bt = req.get('blood_type', 'O+')
            created = req.get('created_at', '')
            status = req.get('status', 'pending')

            # Skip zero coordinates
            if lat == 0.0 and lng == 0.0:
                continue

            # Parse date for recency weighting
            try:
                if isinstance(created, str):
                    dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                else:
                    dt = now
                days_ago = max(0, (now - dt).days)
            except:
                days_ago = 30

            # Recency weight: exponential decay (recent = higher weight)
            recency_weight = math.exp(-0.05 * days_ago)

            grid[(lat, lng)][bt].append({
                'status': status,
                'days_ago': days_ago,
                'weight': recency_weight
            })
        except:
            continue

    results = []
    for (cell_lat, cell_lng), blood_types in grid.items():
        for bt, reqs in blood_types.items():
            total = len(reqs)
            fulfilled = sum(1 for r in reqs if r['status'] == 'fulfilled')
            weighted_score = sum(r['weight'] for r in reqs)

            # Fulfillment gap: unfulfilled demand is higher priority
            unfulfilled_ratio = 1 - (fulfilled / total if total > 0 else 0)
            demand_score = round(weighted_score * (1 + unfulfilled_ratio), 3)

            # Predict next N days demand based on average daily rate
            avg_daily = total / max(1, max(r['days_ago'] for r in reqs) or 1)
            predicted = max(1, round(avg_daily * data.forecast_days))

            results.append({
                'cell_lat': cell_lat,
                'cell_lng': cell_lng,
                'blood_type': bt,
                'demand_score': demand_score,
                'request_count': total,
                'fulfilled_count': fulfilled,
                'predicted_demand': predicted
            })

    # Sort by demand score descending
    results.sort(key=lambda x: x['demand_score'], reverse=True)

    return {
        'areas': results[:50],  # top 50 hotspots
        'total_areas': len(results),
        'forecast_days': data.forecast_days
    }
