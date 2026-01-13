        const connectBtn = document.getElementById("connectBtn");
        const btnText = document.getElementById("btnText");
        const statusEl = document.getElementById("status");
        const addressEl = document.getElementById("address");
        const networkEl = document.getElementById("network");
        const balanceEl = document.getElementById("balance");
        const errorMessage = document.getElementById("errorMessage");
        const container = document.querySelector('.container');

        const AVALANCHE_FUJI_CHAIN_ID = "0xa869";
        let isConnected = false;

        // Create particle effect
        function createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 3000);
        }

        setInterval(createParticle, 500);

        // Shorten address helper
        function shortenAddress(address) {
            if (!address) return "—";
            return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        }

        // Format AVAX balance
        function formatAvaxBalance(balanceWei) {
            const balance = parseInt(balanceWei, 16);
            return (balance / 1e18).toFixed(4) + " AVAX";
        }

        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.add("show");
            setTimeout(() => {
                errorMessage.classList.remove("show");
            }, 5000);
        }

        // Update UI based on connection status
        function updateConnectionStatus(status, className) {
            statusEl.textContent = status;
            statusEl.className = `status-badge ${className}`;
        }

        // Update network display
        function updateNetwork(isCorrect, chainId) {
            if (isCorrect) {
                networkEl.innerHTML = '<span class="network-badge">Fuji Testnet</span>';
            } else {
                networkEl.innerHTML = '<span class="network-badge network-wrong">Wrong Network</span>';
            }
        }

        // Get and display balance
        async function updateBalance(address) {
            try {
                const balanceWei = await window.ethereum.request({
                    method: "eth_getBalance",
                    params: [address, "latest"],
                });
                balanceEl.textContent = formatAvaxBalance(balanceWei);
                balanceEl.classList.add('success-animation');
            } catch (error) {
                console.error("Error fetching balance:", error);
                balanceEl.textContent = "Error";
            }
        }

        // Main connect wallet function
        async function connectWallet() {
            if (typeof window.ethereum === "undefined") {
                showError("Core Wallet not detected. Please install Core Wallet extension.");
                return;
            }

            try {
                // Update UI to connecting state
                btnText.innerHTML = 'Connecting<span class="loading"></span>';
                updateConnectionStatus("Connecting", "status-connecting");
                
                // Request wallet accounts
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });

                const address = accounts[0];
                addressEl.textContent = shortenAddress(address);
                addressEl.title = address; // Show full address on hover

                // Get chainId
                const chainId = await window.ethereum.request({
                    method: "eth_chainId",
                });

                console.log("Connected:", { address, chainId });

                if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
                    updateConnectionStatus("Connected", "status-connected");
                    updateNetwork(true, chainId);
                    await updateBalance(address);
                    
                    // Disable button and update text
                    isConnected = true;
                    connectBtn.disabled = true;
                    btnText.innerHTML = '✓ Connected';
                    container.classList.add('success-animation');
                } else {
                    updateConnectionStatus("Wrong Network", "status-disconnected");
                    updateNetwork(false, chainId);
                    balanceEl.textContent = "—";
                    showError("Please switch to Avalanche Fuji Testnet in your wallet.");
                }
            } catch (error) {
                console.error("Connection error:", error);
                updateConnectionStatus("Failed", "status-disconnected");
                btnText.textContent = "Connect Wallet";
                
                if (error.code === 4001) {
                    showError("Connection rejected. Please approve the connection request.");
                } else {
                    showError("Failed to connect wallet. Please try again.");
                }
            }
        }

        // Listen to account changes
        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on("accountsChanged", async (accounts) => {
                console.log("Account changed:", accounts);
                
                if (accounts.length === 0) {
                    // User disconnected wallet
                    isConnected = false;
                    connectBtn.disabled = false;
                    btnText.textContent = "Connect Wallet";
                    updateConnectionStatus("Disconnected", "status-disconnected");
                    addressEl.textContent = "—";
                    networkEl.textContent = "—";
                    balanceEl.textContent = "—";
                    showError("Wallet disconnected.");
                } else {
                    // Account switched
                    const newAddress = accounts[0];
                    addressEl.textContent = shortenAddress(newAddress);
                    addressEl.title = newAddress;
                    addressEl.classList.add('success-animation');
                    
                    const chainId = await window.ethereum.request({
                        method: "eth_chainId",
                    });
                    
                    if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
                        await updateBalance(newAddress);
                    }
                }
            });

            // Listen to chain/network changes
            window.ethereum.on("chainChanged", async (chainId) => {
                console.log("Chain changed:", chainId);
                
                if (isConnected) {
                    if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
                        updateConnectionStatus("Connected", "status-connected");
                        updateNetwork(true, chainId);
                        
                        const accounts = await window.ethereum.request({
                            method: "eth_accounts",
                        });
                        
                        if (accounts.length > 0) {
                            await updateBalance(accounts[0]);
                        }
                    } else {
                        updateConnectionStatus("Wrong Network", "status-disconnected");
                        updateNetwork(false, chainId);
                        balanceEl.textContent = "—";
                        showError("Please switch to Avalanche Fuji Testnet.");
                    }
                }
            });
        }

        // Event listener
        connectBtn.addEventListener("click", connectWallet);

        // Copy address on click
        addressEl.addEventListener("click", () => {
            if (addressEl.title && addressEl.title !== "—") {
                navigator.clipboard.writeText(addressEl.title);
                const originalText = addressEl.textContent;
                addressEl.textContent = "Copied!";
                setTimeout(() => {
                    addressEl.textContent = originalText;
                }, 1500);
            }
        });