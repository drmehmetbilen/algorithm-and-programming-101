# The allowed range includes both endpoints.
temperature = float(input("Temperature: "))
in_range = temperature >= 10 and temperature <= 30
print(f"In range: {in_range}")
