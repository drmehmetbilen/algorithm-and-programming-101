basket = [
    {"name": "Notebook", "price": 30, "quantity": 2},
    {"name": "Pen", "price": 10, "quantity": 3},
]
total = 0
for item in basket:
    subtotal = item["price"] * item["quantity"]
    total += subtotal
    print(item["name"], subtotal)
print("Total:", total)
