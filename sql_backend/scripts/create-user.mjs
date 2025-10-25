const res = await fetch('http://localhost:3001/api/users', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ username:'BigJ', email:'BigJ@example.com', password:'password' })
});
console.log(res.status, await res.text());
