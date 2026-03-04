import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [accounts, setAccounts] = useState([])
  const [name, setName] = useState('My Campaign')
  const [accountId, setAccountId] = useState('')
  const [targetsText, setTargetsText] = useState('recruteur@example.com,Company,Job Title')

  const load = async () => {
    const r1 = await axios.get('http://localhost:4000/api/campaigns');
    const r2 = await axios.get('http://localhost:4000/api/accounts');
    setCampaigns(r1.data);
    setAccounts(r2.data);
  }
  useEffect(()=>{ load() }, [])

  const create = async () => {
    // parse targets text: one per line email,company,jobTitle
    const lines = targetsText.split('\n').map(l=>l.trim()).filter(Boolean);
    const targets = lines.map(l=>{
      const parts = l.split(',');
      return { email: parts[0]?.trim(), company: parts[1]?.trim(), jobTitle: parts[2]?.trim() };
    });
    const payload = { name, accountId, targets, emailSubject: 'Candidature spontanée' };
    await axios.post('http://localhost:4000/api/campaigns', payload);
    await load();
  }

  const start = async (id) => {
    await axios.post(`http://localhost:4000/api/campaigns/${id}/start`);
    await load();
    alert('Campagne exécutée (vérifiez résultats)');
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginTop: 20 }}>
      <h3>Campagnes</h3>
      <div>
        <label>Nom:</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div>
        <label>Compte:</label>
        <select value={accountId} onChange={e=>setAccountId(e.target.value)}>
          <option value=''>--choisir--</option>
          {accounts.map(a=> <option key={a.id} value={a.id}>{a.user || a.tokens?.email || a.provider}</option>)}
        </select>
      </div>
      <div>
        <label>Targets (one per line: email,company,jobTitle):</label>
        <br />
        <textarea rows={6} cols={60} value={targetsText} onChange={e=>setTargetsText(e.target.value)} />
      </div>
      <div>
        <button onClick={create}>Créer campagne</button>
      </div>

      <h4>Campagnes existantes</h4>
      <ul>
        {campaigns.map(c=> (
          <li key={c.id}>
            {c.name} - {c.status} - {c.targets?.length || 0} targets <button onClick={()=>start(c.id)}>Lancer</button>
            {c.results && c.results.length > 0 && (
              <div>
                <strong>Résultats:</strong>
                <ul>
                  {c.results.map((r,i)=>(<li key={i}>{r.target.email} - {r.ok ? 'ok' : 'err'}</li>))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
