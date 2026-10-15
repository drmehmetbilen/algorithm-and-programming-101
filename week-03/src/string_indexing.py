text = "PYTHON"
print(text[0])
print(text[1])
print(text[-1])
print(len(text))
print("TH" in text)
print("th" in text)

# A new string is created; the original remains unchanged.
word = "cat"
updated = "b" + word[1:]
print(word)
print(updated)

# Try these separately after predicting the exception:
# print(text[6])  # IndexError
# text[0] = "J"  # TypeError
