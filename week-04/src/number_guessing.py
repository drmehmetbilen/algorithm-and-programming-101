# Enter guesses from 1 to 10. At most three attempts.
secret = 7
attempts = 0
found = False
while attempts < 3 and not found:
    guess = int(input("Guess: "))
    attempts += 1
    if guess == secret:
        found = True
    elif guess < secret:
        print("Higher")
    else:
        print("Lower")
print("Found" if found else "No attempts left")
