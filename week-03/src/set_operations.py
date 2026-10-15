a = {1, 2, 3, 3}
b = {3, 4, 5}
print(len(a))
# sorted returns lists so the printed order is predictable.
print(sorted(a | b))
print(sorted(a & b))
print(sorted(a - b))
print(sorted(a ^ b))
print(3 in a)
print(a.add(6))
print(sorted(a))
print(a.discard(99))
print(sorted(a))

names = ["Ada", "Lin", "Ada"]
print(sorted(set(names)))
print(type({}).__name__)
print(type(set()).__name__)
points = {(1, 2), (3, 4)}
print((1, 2) in points)
# print(a[0])  # TypeError: no positional index
