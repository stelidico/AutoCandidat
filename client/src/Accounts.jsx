import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])

  const load = async () => {
    const r = await axios.get('http://localhost:4000/api/accounts');
    setAccounts(r.data);
  }

  useEffect(()=>{ load() }, [])

  const saveFromLocal = async (acc) => {
    // acc: tokens from localStorage
    const payload = { provider: 'gmail', user: acc.user || acc.email || '', tokens: acc };
    const r = await axios.post('http://localhost:4000/api/accounts', payload);
    await load();
    alert('Compte ajouté: ' + r.data.user);
  }

  const remove = async (id) => {
    await axios.delete('http://localhost:4000/api/accounts/' + id);
    await load();
  }

  const importLocal = () => {
    const saved = localStorage.getItem('gmail_oauth');
    if (!saved) return alert('Aucun token local trouvé. Connectez Gmail d\'abord.');
    const obj = JSON.parse(saved);
    saveFromLocal(obj);
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginTop: 20 }}>
      <h3>Comptes Email</h3>
      <button onClick={importLocal}>Importer token local (Gmail)</button>
      <ul>
        {accounts.map(a => (
          <li key={a.id}>
            {a.provider} - {a.user || a.tokens?.email || a.defaultFrom} <button onClick={()=>remove(a.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
