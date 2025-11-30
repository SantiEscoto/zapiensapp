<div className="login-form-container">
  <table className="login-table">
    <tbody>
      <tr>
        <td>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
        </td>
      </tr>
      <tr>
        <td>
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
        </td>
      </tr>
    </tbody>
  </table>
</div>