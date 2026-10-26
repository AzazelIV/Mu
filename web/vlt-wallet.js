/* ViltrumiraTest (VLT) wallet bridge — read-only first phase.
 * BNB Smart Chain Testnet only (chain ID 97). No private keys are handled here.
 * Payments/rewards remain disabled until a trusted backend is implemented.
 */
(function () {
  "use strict";

  const TOKEN_ADDRESS = "0x5Ea334a1F91818F5B9Ac6F6DE69c075DdA47193B";
  const TOKEN_DECIMALS = 18;
  const CHAIN_ID_HEX = "0x61";
  const CHAIN_ID_DEC = 97;
  const NETWORK = {
    chainId: CHAIN_ID_HEX,
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
    rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"]
  };

  const $ = (id) => document.getElementById(id);
  let account = null;

  function setStatus(message, kind) {
    const el = $("vltWalletStatus");
    if (!el) return;
    el.textContent = message;
    el.dataset.kind = kind || "info";
  }

  function shortAddress(address) {
    return address ? address.slice(0, 6) + "…" + address.slice(-4) : "";
  }

  function formatTokenBalance(raw) {
    const value = BigInt(raw);
    const scale = 10n ** BigInt(TOKEN_DECIMALS);
    const whole = value / scale;
    const fraction = (value % scale).toString().padStart(TOKEN_DECIMALS, "0").slice(0, 4).replace(/0+$/, "");
    return whole.toLocaleString("en-US") + (fraction ? "." + fraction : "");
  }

  function updateAccountUI() {
    const addressEl = $("vltWalletAddress");
    const connectBtn = $("vltConnectButton");
    if (addressEl) addressEl.textContent = account ? shortAddress(account) : "No wallet connected";
    if (connectBtn) connectBtn.textContent = account ? "Wallet connected" : "Connect MetaMask";
  }

  async function ensureTestnet() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId.toLowerCase() === CHAIN_ID_HEX) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }]
      });
    } catch (error) {
      if (error && error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK]
        });
      } else {
        throw error;
      }
    }
    const verifiedChain = await window.ethereum.request({ method: "eth_chainId" });
    if (verifiedChain.toLowerCase() !== CHAIN_ID_HEX) {
      throw new Error("MetaMask is not connected to BNB Smart Chain Testnet.");
    }
  }

  async function readBalance() {
    if (!window.ethereum || !account) return;
    setStatus("Reading VLT balance…", "info");
    // balanceOf(address) selector + 32-byte left-padded address.
    const data = "0x70a08231" + account.slice(2).toLowerCase().padStart(64, "0");
    const raw = await window.ethereum.request({
      method: "eth_call",
      params: [{ to: TOKEN_ADDRESS, data: data }, "latest"]
    });
    const balanceEl = $("vltWalletBalance");
    if (balanceEl) balanceEl.textContent = formatTokenBalance(raw);
    setStatus("Connected to BNB Smart Chain Testnet · Chain ID " + CHAIN_ID_DEC, "success");
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("MetaMask was not detected. Install or unlock MetaMask, then try again.", "error");
      return;
    }
    try {
      setStatus("Requesting wallet connection…", "info");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts.length) throw new Error("No wallet account was selected.");
      account = accounts[0];
      await ensureTestnet();
      updateAccountUI();
      await readBalance();
    } catch (error) {
      const message = error && error.message ? error.message : "Could not connect wallet.";
      setStatus(message, "error");
    }
  }

  function openModal() {
    const modal = $("vltWalletModal");
    if (!modal) return;
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
    if (account) readBalance().catch((e) => setStatus(e.message || "Could not read balance.", "error"));
  }

  function closeModal() {
    const modal = $("vltWalletModal");
    if (!modal) return;
    modal.classList.remove("on");
    modal.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("DOMContentLoaded", function () {
    const openButton = $("muBtnVltWallet");
    const closeButton = $("vltWalletClose");
    const backdrop = $("vltWalletBackdrop");
    const connectButton = $("vltConnectButton");
    const refreshButton = $("vltRefreshBalance");
    if (openButton) openButton.addEventListener("click", openModal);
    if (closeButton) closeButton.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (connectButton) connectButton.addEventListener("click", connectWallet);
    if (refreshButton) refreshButton.addEventListener("click", function () {
      if (!account) return connectWallet();
      ensureTestnet().then(readBalance).catch((e) => setStatus(e.message || "Could not refresh balance.", "error"));
    });

    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", function (accounts) {
        account = accounts && accounts.length ? accounts[0] : null;
        updateAccountUI();
        if (account) ensureTestnet().then(readBalance).catch((e) => setStatus(e.message || "Network error.", "error"));
        else {
          if ($("vltWalletBalance")) $("vltWalletBalance").textContent = "—";
          setStatus("Wallet disconnected.", "info");
        }
      });
      window.ethereum.on("chainChanged", function () {
        if (!account) return;
        ensureTestnet().then(readBalance).catch((e) => setStatus(e.message || "Switch to BNB Smart Chain Testnet.", "error"));
      });
    }
    updateAccountUI();
  });
})();
