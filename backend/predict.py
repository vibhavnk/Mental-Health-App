# predict.py

import sys
import joblib
import numpy as np

# Load the model
model = joblib.load('assessment_model.pkl')

# Parse the input
answers = np.array([int(x) for x in sys.argv[1].strip('[]').split(',')]).reshape(1, -1)

# Make a prediction
prediction = model.predict(answers)

# Output the result
print(prediction[0])
