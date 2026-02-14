document.getElementById("connect").onclick = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    alert("Wallet connected!")
  } else {
    alert("Install MetaMask")
  }
}
