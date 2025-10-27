const res = await fetch('http://25.3.215.148:3001/api/users', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ username:'Hassaan', email:'Hassan@example.com', password:'password' })
});
console.log(res.status, await res.text());
