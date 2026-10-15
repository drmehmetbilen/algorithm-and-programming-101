point = (3, 5)
x, y = point
print(x)
print(y)
print(type((5)).__name__)
print(type((5,)).__name__)
print(type(()).__name__)

record = (1042, "Ada", 90)
student_id, name, score = record
print(name, score)
print(record[1:])

# A tuple cannot replace its item references, but an inner list can change.
record = ("Ada", [80, 90])
record[1].append(100)
print(record)
# point[0] = 9  # TypeError
# x, y, z = point  # ValueError
