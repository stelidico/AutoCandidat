import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function EmailConfig() {
  const [connected, setConnected] = useState(false)
  const [tokens, setTokens] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('Candidature')
  const [body, setBody] = useState('Bonjour, je vous envoie ma candidature...')

  useEffect(() => {
    const saved = localStorage.getItem('gmail_oauth');
    if (saved) {
      const obj = JSON.parse(saved);
      setTokens(obj);
      setConnected(true);
      if (obj.user) setUserEmail(obj.user);
    }

    function onMessage(e) {
      try {
        const msg = e.data;
        if (msg && msg.type === 'gmail_oauth' && msg.data) {
          const t = msg.data;
          // try to extract email from id_token if present
          t.user = t.email || t.user || '';
          localStorage.setItem('gmail_oauth', JSON.stringify(t));
          setTokens(t);
          setConnected(true);
        }
      } catch (e) {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [])

  const connect = async () => {
    const r = await axios.get('http://localhost:4000/auth/google/url');
    const url = r.data.url;
    window.open(url, 'gmail_oauth', 'width=600,height=700');
  }

  const disconnect = () => {
    localStorage.removeItem('gmail_oauth');
    setTokens(null); setConnected(false);
  }

  const send = async () => {
    if (!connected) return alert('Connectez un compte Gmail d\'abord');
    if (!to) return alert('Entrez une adresse destinataire');
    try {
      const oauth = { type: 'oauth2', user: tokens.user || '' };
      if (tokens.refresh_token) oauth.refreshToken = tokens.refresh_token;
      if (tokens.access_token) oauth.accessToken = tokens.access_token;

      const r = await axios.post('http://localhost:4000/api/send-email', {
        from: userEmail || tokens.user || tokens.email || 'Me',
        to,
        subject,
        text: body,
        oauth
      });
      alert('Email envoyé: ' + JSON.stringify(r.data));
    } catch (err) {
      alert('Erreur envoi: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginTop: 20 }}>
      <h3>Configuration Email</h3>
      {connected ? (
        <div>
          <div>Connecté: {tokens?.user || tokens?.email || 'Gmail'}</div>
          <button onClick={disconnect}>Déconnecter</button>
        </div>
      ) : (
        <div>
          <button onClick={connect}>Connecter Gmail (OAuth)</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <h4>Envoyer un email</h4>
        <div>
          <label>From (optionnel):</label>
          <input value={userEmail} onChange={e=>setUserEmail(e.target.value)} placeholder="me@gmail.com" />
        </div>
        <div>
          <label>To:</label>
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="recruteur@example.com" />
        </div>
        <div>
          <label>Subject:</label>
          <input value={subject} onChange={e=>setSubject(e.target.value)} />
        </div>
        <div>
          <label>Body:</label>
          <br />
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} cols={60} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={send}>Envoyer</button>
        </div>
      </div>
    </div>
  )
}
