# pip install tensorflow pillow numpy (if you add a real model)
import sys, json, random
# args: image path
image_path = sys.argv[1] if len(sys.argv)>1 else "none"
# Dummy predictions
predictions = [
  {"disease":"Aphids", "confidence": 0.85, "remedy":"Neem oil spray"},
  {"disease":"Blight", "confidence": 0.66, "remedy":"Remove infected leaves; copper fungicide"},
  {"disease":"Healthy", "confidence": 0.9, "remedy":"No action needed"}
]
out = random.choice(predictions)
print(json.dumps(out))