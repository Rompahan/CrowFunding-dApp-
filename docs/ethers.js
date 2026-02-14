const CF_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CF_ABI = [
  "function createCampaign(string title,uint256 goalWei,uint256 durationSeconds) returns (uint256)",
  "function contribute(uint256 id) payable",
  "function finalize(uint256 id)",
  "function refund(uint256 id)",
  "function getCampaign(uint256 id) view returns (string,address,uint256,uint256,uint256,bool,bool)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const logEl = document.getElementById("log");
const addrEl = document.getElementById("addr");
const netEl = document.getElementById("net");
const ethBalEl = document.getElementById("ethBal");
const tokBalEl = document.getElementById("tokBal");
const infoBox = document.getElementById("infoBox");

let provider, signer, account, cf, token;

function log(msg) {
  logEl.textContent = `${new Date().toLocaleTimeString()}  ${msg}\n` + logEl.textContent;
}

async function refreshBalances() {
  if (!provider || !account) return;

  const ethBal = await provider.getBalance(account);
  ethBalEl.textContent = ethers.formatEther(ethBal);

  const dec = await token.decimals();
  const sym = await token.symbol();
  const tb = await token.balanceOf(account);
  tokBalEl.textContent = `${ethers.formatUnits(tb, dec)} ${sym}`;
}

async function checkNetwork() {
  const network = await provider.getNetwork();
  netEl.textContent = `${network.name} (chainId=${network.chainId})`;

  const allowed = [11155111n, 17000n]; 
  if (!allowed.includes(network.chainId)) {
    log("Wrong network. Switch to Sepolia or Holesky in MetaMask.");
  }
}

document.getElementById("connectBtn").onclick = async () => {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  addrEl.textContent = account;

  cf = new ethers.Contract(CF_ADDRESS, CF_ABI, signer);
  token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);

  await checkNetwork();
  await refreshBalances();
  log("Connected.");
};

document.getElementById("createBtn").onclick = async () => {
  try {
    const title = document.getElementById("title").value;
    const goalEth = document.getElementById("goal").value;
    const duration = document.getElementById("duration").value;

    const goalWei = ethers.parseEther(goalEth);
    const tx = await cf.createCampaign(title, goalWei, BigInt(duration));
    log("Create tx sent: " + tx.hash);
    await tx.wait();
    log("Campaign created.");
  } catch (e) {
    log("Error: " + (e.shortMessage || e.message));
  }
};

document.getElementById("contribBtn").onclick = async () => {
  try {
    const id = BigInt(document.getElementById("cid").value);
    const amountEth = document.getElementById("amount").value;
    const value = ethers.parseEther(amountEth);

    const tx = await cf.contribute(id, { value });
    log("Contribute tx sent: " + tx.hash);
    await tx.wait();
    log("Contribution confirmed. Reward tokens minted.");
    await refreshBalances();
  } catch (e) {
    log("Error: " + (e.shortMessage || e.message));
  }
};

document.getElementById("infoBtn").onclick = async () => {
  try {
    const id = BigInt(document.getElementById("infoId").value);
    const c = await cf.getCampaign(id);
    const title = c[0];
    const owner = c[1];
    const goalWei = c[2];
    const deadline = c[3];
    const raisedWei = c[4];
    const finalized = c[5];
    const success = c[6];

    infoBox.innerHTML = `
      <div><b>Title:</b> ${title}</div>
      <div><b>Owner:</b> ${owner}</div>
      <div><b>Goal:</b> ${ethers.formatEther(goalWei)} ETH</div>
      <div><b>Raised:</b> ${ethers.formatEther(raisedWei)} ETH</div>
      <div><b>Deadline:</b> ${new Date(Number(deadline) * 1000).toLocaleString()}</div>
      <div><b>Finalized:</b> ${finalized}</div>
      <div><b>Successful:</b> ${success}</div>
    `;
    log("Campaign loaded.");
  } catch (e) {
    log("Error: " + (e.shortMessage || e.message));
  }
};

document.getElementById("finalizeBtn").onclick = async () => {
  try {
    const id = BigInt(document.getElementById("finId").value);
    const tx = await cf.finalize(id);
    log("Finalize tx sent: " + tx.hash);
    await tx.wait();
    log("Finalized.");
    await refreshBalances();
  } catch (e) {
    log("Error: " + (e.shortMessage || e.message));
  }
};

document.getElementById("refundBtn").onclick = async () => {
  try {
    const id = BigInt(document.getElementById("finId").value);
    const tx = await cf.refund(id);
    log("Refund tx sent: " + tx.hash);
    await tx.wait();
    log("Refunded.");
    await refreshBalances();
  } catch (e) {
    log("Error: " + (e.shortMessage || e.message));
  }
};