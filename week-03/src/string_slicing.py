text = "PYTHON"
print(text[1:5])
print(text[:3])
print(text[3:])
print(text[::2])
print(text[::-1])
print(repr(text[99:]))
print(text[:])

filename = "report.csv"
print(filename[-3:])
print(filename[:-4])

# Omitted stop and explicit -1 behave differently for negative steps.
print(text[::-1])
print(repr(text[:-1:-1]))
# print(text[::0])  # ValueError: slice step cannot be zero
