"""
Train ML models for:
1. Donor eligibility scoring
2. Donor availability prediction
3. Matching score (priority ranking)
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

os.makedirs('models', exist_ok=True)

np.random.seed(42)
N = 5000

# ─── 1. Eligibility Model ────────────────────────────────────────────────────
age = np.random.randint(15, 70, N)
weight = np.random.randint(40, 110, N)
recent_donation = np.random.randint(0, 2, N)       # 0=No, 1=Yes
on_medication = np.random.randint(0, 2, N)
recent_illness = np.random.randint(0, 2, N)
chronic_condition = np.random.randint(0, 2, N)
alcohol_recent = np.random.randint(0, 2, N)
feeling_well = np.random.randint(0, 2, N)           # 1=Yes

eligible = (
    (age >= 18) & (age <= 60) &
    (weight >= 50) &
    (recent_donation == 0) &
    (on_medication == 0) &
    (recent_illness == 0) &
    (chronic_condition == 0) &
    (alcohol_recent == 0) &
    (feeling_well == 1)
).astype(int)

elig_df = pd.DataFrame({
    'age': age, 'weight': weight, 'recent_donation': recent_donation,
    'on_medication': on_medication, 'recent_illness': recent_illness,
    'chronic_condition': chronic_condition, 'alcohol_recent': alcohol_recent,
    'feeling_well': feeling_well, 'eligible': eligible
})

X_e = elig_df.drop('eligible', axis=1)
y_e = elig_df['eligible']
X_train, X_test, y_train, y_test = train_test_split(X_e, y_e, test_size=0.2)

elig_model = RandomForestClassifier(n_estimators=100, random_state=42)
elig_model.fit(X_train, y_train)
print(f"Eligibility model accuracy: {accuracy_score(y_test, elig_model.predict(X_test)):.3f}")
joblib.dump(elig_model, 'models/eligibility_model.pkl')

# ─── 2. Availability Prediction Model ────────────────────────────────────────
total_donations = np.random.randint(0, 20, N)
reliability_score = np.random.randint(0, 100, N)
days_since_last_donation = np.random.randint(0, 365, N)
priority_opt_in = np.random.randint(0, 2, N)
distance_km = np.random.uniform(0, 50, N)

availability_score = (
    reliability_score * 0.4 +
    np.clip(days_since_last_donation / 90, 0, 1) * 30 +
    priority_opt_in * 20 +
    np.clip(1 - distance_km / 50, 0, 1) * 10
)

avail_df = pd.DataFrame({
    'total_donations': total_donations,
    'reliability_score': reliability_score,
    'days_since_last_donation': days_since_last_donation,
    'priority_opt_in': priority_opt_in,
    'distance_km': distance_km,
    'availability_score': availability_score
})

X_a = avail_df.drop('availability_score', axis=1)
y_a = avail_df['availability_score']
X_train_a, X_test_a, y_train_a, y_test_a = train_test_split(X_a, y_a, test_size=0.2)

avail_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
avail_model.fit(X_train_a, y_train_a)
print(f"Availability model R2: {avail_model.score(X_test_a, y_test_a):.3f}")
joblib.dump(avail_model, 'models/availability_model.pkl')

print("Models saved to models/")
