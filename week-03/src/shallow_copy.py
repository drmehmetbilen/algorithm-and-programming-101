groups = [[80, 90]]
backup = groups.copy()
backup[0].append(100)
print(groups)
print(backup)
print(groups is backup)
print(groups[0] is backup[0])

# Replacing a slot in the copied outer list does not replace the original slot.
backup[0] = [0]
print(groups)
print(backup)
print(groups[0] is backup[0])
