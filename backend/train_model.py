# train_model.py

import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Sample data for training (replace with your dataset)
X = np.array([
    [1, 1, 1, 1],
    [0, 1, 0, 0],
    [1, 0, 1, 0],
    [0, 0, 0, 1],
    [1, 1, 0, 1]
])
y = np.array([1, 0, 1, 0, 1])

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a logistic regression model
model = LogisticRegression()
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
print('Accuracy:', accuracy_score(y_test, y_pred))

# Save the model
joblib.dump(model, 'assessment_model.pkl')
