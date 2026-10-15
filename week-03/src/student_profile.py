student = {"name": "Ada", "scores": [80, 90], "skills": {"Python"}}
student["scores"].append(100)
student["skills"].add("SQL")
average = sum(student["scores"]) / len(student["scores"])
print(student["name"])
print(student["scores"])
print(sorted(student["skills"]))
print(f"Average: {average:.1f}")

# Extension: add a field, update a nested value, and check membership.
student["city"] = "Ankara"
student["scores"][0] = 85
has_python = "Python" in student["skills"]
print(student["city"])
print(student["scores"])
print(has_python)
