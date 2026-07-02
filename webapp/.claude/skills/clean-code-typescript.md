# Clean Code TypeScript

Review TypeScript code for clean code principles based on Robert C. Martin's "Clean Code" adapted for TypeScript.

## Purpose

Analyze TypeScript code to ensure it follows clean code principles: meaningful naming, single responsibility, immutability, type safety, and maintainability. Provide specific, actionable feedback to improve code quality.

## Principles

### 1. Meaningful Names
- Use pronounceable, searchable variable names
- Names should reveal intent without comments
- Use the same vocabulary for the same concept
- Avoid mental mapping (single-letter variables)
- Don't add unnecessary context

### 2. Functions
- Keep functions small (do one thing)
- Function names should say what they do
- Limit to 2 or fewer parameters (use objects for more)
- Functions should be one level of abstraction
- Avoid side effects
- No flags as parameters
- Prefer functional over imperative programming

### 3. Single Responsibility
- Each function/class does one thing well
- Extract complex logic into named functions
- Split mixed concerns into separate units

### 4. Type Safety
- Leverage TypeScript's type system fully
- Avoid type checking with typeof/instanceof when polymorphism fits
- Use discriminated unions over conditionals
- Define explicit types for parameters and returns

### 5. Immutability
- Prefer const over let
- Return new objects instead of mutating
- Use spread operators and array methods (map, filter, reduce)
- Avoid side effects in functions

### 6. SOLID Principles
- **Single Responsibility**: One reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable
- **Interface Segregation**: Don't depend on unused methods
- **Dependency Inversion**: Depend on abstractions

## Patterns

### Pattern 1: Replace Magic Values with Named Constants

```typescript
// ❌ Bad
setTimeout(restart, 86400000);

// ✅ Good
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
setTimeout(restart, MILLISECONDS_PER_DAY);
```

### Pattern 2: Use Objects for Multiple Parameters

```typescript
// ❌ Bad
function createMenu(title: string, body: string, buttonText: string, cancellable: boolean) {
  // ...
}

// ✅ Good
type MenuOptions = {
  title: string;
  body: string;
  buttonText: string;
  cancellable: boolean;
};

function createMenu(options: MenuOptions) {
  // ...
}
```

### Pattern 3: Extract Functions for Single Responsibility

```typescript
// ❌ Bad
function emailActiveClients(clients: Client[]) {
  clients.forEach((client) => {
    const clientRecord = database.lookup(client);
    if (clientRecord.isActive()) {
      email(client);
    }
  });
}

// ✅ Good
function emailActiveClients(clients: Client[]) {
  clients.filter(isActiveClient).forEach(email);
}

function isActiveClient(client: Client): boolean {
  const clientRecord = database.lookup(client);
  return clientRecord.isActive();
}
```

### Pattern 4: Encapsulate Conditionals

```typescript
// ❌ Bad
if (subscription.isTrial || account.balance > 0) {
  // ...
}

// ✅ Good
function canActivateService(subscription: Subscription, account: Account): boolean {
  return subscription.isTrial || account.balance > 0;
}

if (canActivateService(subscription, account)) {
  // ...
}
```

### Pattern 5: Polymorphism Over Conditionals

```typescript
// ❌ Bad
class Airplane {
  getCruisingAltitude() {
    switch (this.type) {
      case '777':
        return this.getMaxAltitude() - this.getPassengerCount();
      case 'Air Force One':
        return this.getMaxAltitude();
    }
  }
}

// ✅ Good
abstract class Airplane {
  abstract getCruisingAltitude(): number;
  
  protected getMaxAltitude(): number {
    // shared logic
  }
}

class Boeing777 extends Airplane {
  getCruisingAltitude(): number {
    return this.getMaxAltitude() - this.getPassengerCount();
  }
}

class AirForceOne extends Airplane {
  getCruisingAltitude(): number {
    return this.getMaxAltitude();
  }
}
```

### Pattern 6: Immutable Operations

```typescript
// ❌ Bad
function addItemToCart(cart: CartItem[], item: Item): void {
  cart.push({ item, date: Date.now() });
}

// ✅ Good
function addItemToCart(cart: CartItem[], item: Item): CartItem[] {
  return [...cart, { item, date: Date.now() }];
}
```

### Pattern 7: Default Parameters

```typescript
// ❌ Bad
function loadPages(count?: number) {
  const loadCount = count !== undefined ? count : 10;
}

// ✅ Good
function loadPages(count: number = 10) {
  // ...
}
```

### Pattern 8: Avoid Flags in Parameters

```typescript
// ❌ Bad
function createFile(name: string, temp: boolean) {
  if (temp) {
    fs.create(`./temp/${name}`);
  } else {
    fs.create(name);
  }
}

// ✅ Good
function createTempFile(name: string) {
  createFile(`./temp/${name}`);
}

function createFile(name: string) {
  fs.create(name);
}
```

### Pattern 9: Functional Over Imperative

```typescript
// ❌ Bad
let totalOutput = 0;
for (let i = 0; i < contributions.length; i++) {
  totalOutput += contributions[i].linesOfCode;
}

// ✅ Good
const totalOutput = contributions
  .reduce((totalLines, output) => totalLines + output.linesOfCode, 0);
```

### Pattern 10: Meaningful Type Names

```typescript
// ❌ Bad
type DtaRcrd102 = {
  genymdhms: Date;
  modymdhms: Date;
}

// ✅ Good
type Customer = {
  generationTimestamp: Date;
  modificationTimestamp: Date;
}
```

## Checklist

When reviewing code, check for:

### Naming
- [ ] Are all variables pronounceable?
- [ ] Are names searchable (no single letters except loop indices)?
- [ ] Do names reveal intent?
- [ ] Is vocabulary consistent across the codebase?
- [ ] Is unnecessary context removed?

### Functions
- [ ] Does each function do only one thing?
- [ ] Are there 2 or fewer parameters (or object parameter)?
- [ ] Do function names describe what they do?
- [ ] Are functions one level of abstraction?
- [ ] Are there no side effects?
- [ ] Are boolean flags avoided?

### Types
- [ ] Are all parameters and returns explicitly typed?
- [ ] Is type checking avoided in favor of polymorphism?
- [ ] Are optional parameters using default values?
- [ ] Are types meaningful and descriptive?

### Immutability
- [ ] Are const declarations used instead of let?
- [ ] Do functions return new objects instead of mutating?
- [ ] Are array methods (map/filter/reduce) preferred over loops?

### Structure
- [ ] Is duplicate code eliminated?
- [ ] Are conditionals encapsulated in named functions?
- [ ] Is polymorphism used instead of switch statements?
- [ ] Are magic numbers replaced with named constants?

### Single Responsibility
- [ ] Can each function be described in one simple sentence?
- [ ] Does each class have one reason to change?
- [ ] Is complex logic extracted into smaller functions?

## Anti-Patterns

### Anti-Pattern 1: Generic or Abbreviated Names

```typescript
// ❌ Bad
function getUserInfo(): User;
function getUserDetails(): User;
function getUserData(): User;

const u = getUser();
const s = getSubscription();

// ✅ Good
function getUser(): User;

const user = getUser();
const subscription = getSubscription();
```

### Anti-Pattern 2: Functions Doing Multiple Things

```typescript
// ❌ Bad
function parseCode(code: string) {
  const REGEXES = [ /* ... */ ];
  const statements = code.split(' ');
  const tokens = [];
  // mixing tokenization and parsing
}

// ✅ Good
function parseCode(code: string) {
  const tokens = tokenize(code);
  const syntaxTree = parse(tokens);
  return syntaxTree;
}

function tokenize(code: string): Token[] {
  // only tokenization
}

function parse(tokens: Token[]): SyntaxTree {
  // only parsing
}
```

### Anti-Pattern 3: Too Many Function Parameters

```typescript
// ❌ Bad
function createPerson(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  country: string
) {
  // ...
}

// ✅ Good
type PersonData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

function createPerson(data: PersonData) {
  // ...
}
```

### Anti-Pattern 4: Mutating Input Parameters

```typescript
// ❌ Bad
let name = 'Robert C. Martin';

function toBase64() {
  name = btoa(name);
}

toBase64();

// ✅ Good
const name = 'Robert C. Martin';

function toBase64(text: string): string {
  return btoa(text);
}

const encodedName = toBase64(name);
```

### Anti-Pattern 5: Polluting Global Prototypes

```typescript
// ❌ Bad
Array.prototype.diff = function <T>(other: T[]): T[] {
  // ...
};

// ✅ Good
class MyArray<T> extends Array<T> {
  diff(other: T[]): T[] {
    const hash = new Set(other);
    return this.filter(elem => !hash.has(elem));
  }
}
```

### Anti-Pattern 6: Negative Conditionals

```typescript
// ❌ Bad
function isEmailNotUsed(email: string): boolean {
  // ...
}

if (isEmailNotUsed(email)) {
  // ...
}

// ✅ Good
function isEmailUsed(email: string): boolean {
  // ...
}

if (!isEmailUsed(email)) {
  // ...
}
```

### Anti-Pattern 7: Unnecessary Context

```typescript
// ❌ Bad
type Car = {
  carMake: string;
  carModel: string;
  carColor: string;
}

function carGetMake(car: Car): string {
  return car.carMake;
}

// ✅ Good
type Car = {
  make: string;
  model: string;
  color: string;
}

function getMake(car: Car): string {
  return car.make;
}
```

### Anti-Pattern 8: Type Checking Instead of Polymorphism

```typescript
// ❌ Bad
function processAnimal(animal: Animal) {
  if (animal.type === 'dog') {
    return animal.bark();
  } else if (animal.type === 'cat') {
    return animal.meow();
  }
}

// ✅ Good
abstract class Animal {
  abstract makeSound(): string;
}

class Dog extends Animal {
  makeSound(): string {
    return this.bark();
  }
}

class Cat extends Animal {
  makeSound(): string {
    return this.meow();
  }
}

function processAnimal(animal: Animal) {
  return animal.makeSound();
}
```

### Anti-Pattern 9: Imperative Loops Instead of Functional Methods

```typescript
// ❌ Bad
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i]);
  }
}

// ✅ Good
const activeUsers = users.filter(user => user.isActive);
```

### Anti-Pattern 10: Magic Numbers and Strings

```typescript
// ❌ Bad
if (user.role === 'admin' && user.age > 18) {
  setTimeout(notify, 3600000);
}

// ✅ Good
const ROLE_ADMIN = 'admin';
const LEGAL_AGE = 18;
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

function isEligibleAdmin(user: User): boolean {
  return user.role === ROLE_ADMIN && user.age > LEGAL_AGE;
}

if (isEligibleAdmin(user)) {
  setTimeout(notify, HOUR_IN_MILLISECONDS);
}
```

## Usage

This skill analyzes TypeScript code and provides feedback on:
- Variable and function naming
- Function complexity and responsibilities
- Type safety and usage
- Immutability practices
- Code structure and organization
- SOLID principle violations
- Common anti-patterns

When reviewing code, focus on actionable improvements with specific examples showing the before and after.