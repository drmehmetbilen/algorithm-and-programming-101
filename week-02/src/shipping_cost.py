# Classroom rules: weight in (0, 10] kg and membership entered as yes or no.
# Assume numeric weight input; invalid numeric ranges are handled below.
weight = float(input("Weight (kg): "))
member = input("Member (yes/no): ") == "yes"
if weight <= 0 or weight > 10:
    print("Invalid weight")
else:
    if weight <= 2:
        cost = 5
    elif weight <= 5:
        cost = 8
    else:
        cost = 12
    if member:
        cost -= 2
    print(f"Shipping: {cost} credits")
