# math belongs to Python's standard library; no package installation is needed.
import math

value = -3.7
print("Floor:", math.floor(value))
print("Ceil:", math.ceil(value))
print("Trunc:", math.trunc(value))
print("Square root:", math.sqrt(9))
print("Factorial:", math.factorial(5))

radius = 2.0
area = math.pi * radius ** 2
print(f"Circle area: {area:.3f}")

angle_degrees = 30.0
angle_radians = math.radians(angle_degrees)
print(f"Radians: {angle_radians:.6f}")
print(f"Sine: {math.sin(angle_radians):.6f}")
print(f"Cosine: {math.cos(angle_radians):.6f}")
print(f"Distance: {math.hypot(3, 4):.3f}")

# sqrt needs a non-negative real input; factorial needs a non-negative integer.
# Floating-point results are approximate. Use a tolerance for comparison.
print("Close to 0.3:", math.isclose(0.1 + 0.2, 0.3))
