# One value and a collection of values.
score = 72
scores = [72, 85, 91]
first = scores[0]
scores[0] = 99
print(first)
print(scores)

print(type(score).__name__)
print(type(scores).__name__)
print(type((3, 5)).__name__)
print(type({"name": "Ada"}).__name__)
print(type({"Python", "C"}).__name__)
print(len(scores))
print(85 in scores)
