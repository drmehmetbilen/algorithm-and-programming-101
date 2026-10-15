scores = [72, 85, 72]
result = scores.append(95)
print(result)
print(scores)
scores.extend([90, 100])
scores.insert(1, 80)
scores[0] = 75
scores.remove(72)
last = scores.pop()
print(last)
print(scores)

ordered = sorted(scores)
print(scores)
print(ordered)
result = scores.sort()
print(result)
print(scores)
scores.reverse()
print(scores)
print(scores[:2])
print(sum(scores), min(scores), max(scores))

# append adds one object; extend adds its individual items.
a = [1, 2]
a.append([3, 4])
b = [1, 2]
b.extend([3, 4])
print(a)
print(b)
