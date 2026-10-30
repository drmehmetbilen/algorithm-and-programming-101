# Enter whole numbers; -1 ends the input.
total = 0
value = int(input("Number (-1 to stop): "))
while value != -1:
    total += value
    value = int(input("Number (-1 to stop): "))
print(total)
