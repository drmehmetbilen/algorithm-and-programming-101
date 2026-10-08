# Assume an integer score from 0 to 100.
score = int(input("Score (0-100): "))
if score >= 85:
    category = "High"
elif score >= 60:
    category = "Pass"
else:
    category = "Retry"
print(category)
