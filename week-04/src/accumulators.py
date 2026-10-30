scores = [72, 85, 91]
total = 0
count = 0
for score in scores:
    total += score
    count += 1
print(total, count)
if count > 0:
    print(f"Average: {total / count:.1f}")
else:
    print("No scores")
