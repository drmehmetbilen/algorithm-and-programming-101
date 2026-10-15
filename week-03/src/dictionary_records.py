student = {"name": "Ada", "score": 90}
print(student["name"])
print(student.get("city", "Unknown"))
print(student.get("city"))
print("name" in student)
print("Ada" in student)
print("Ada" in student.values())

student["score"] = 95
student["city"] = "Ankara"
print(list(student.keys()))
print(list(student.values()))
print(list(student.items()))
del student["city"]
print(student)

student["scores"] = [80, 90]
student["scores"].append(100)
print(student["scores"][0])
print(sum(student["scores"]))
# print(student["missing"])  # KeyError
