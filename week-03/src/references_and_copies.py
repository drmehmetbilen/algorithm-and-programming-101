scores = [80, 90]
backup = scores
scores.append(100)
print(scores)
print(backup)
print(scores is backup)

# Repeat with a separate outer list.
scores = [80, 90]
backup = scores.copy()
print(scores == backup)
print(scores is backup)
scores.append(100)
print(scores)
print(backup)
