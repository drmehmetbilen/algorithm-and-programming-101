scores = [45, 60, 85, 90]
total = 0
passed = 0
for score in scores:
    total += score
    if score >= 60:
        passed += 1
print("Passed:", passed)
if len(scores) > 0:
    print(f"Average: {total / len(scores):.1f}")
else:
    print("No scores")
