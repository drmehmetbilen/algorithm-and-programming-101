# String methods return values; they do not modify the original string.
text = "  Python is fun  "
print("Original:", repr(text))
print("Stripped:", text.strip())
print("Lower:", text.lower())
print("Upper:", text.upper())
print("Replaced:", text.replace("Python", "Programming"))
print("Words:", text.split())
print("Joined:", " / ".join(text.split()))
print("Starts with Python:", text.strip().startswith("Python"))
print("Position:", text.find("Python"))
print("Unchanged:", repr(text))

raw_name = "  Ada Lovelace  "
clean_name = raw_name.strip()
clean_name = clean_name.lower()
clean_name = clean_name.replace(" ", "_")
print("Username:", clean_name)
