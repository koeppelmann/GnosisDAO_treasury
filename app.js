// GnosisDAO Treasury Dashboard - Zerion vs DeBank Comparison

// Data stores
let zerionData = {};
let debankData = {};
let comparisonData = [];
let filteredData = [];
let historicalIndex = null;
let isViewingSnapshot = false;

// Asset category definitions
const CATEGORIES = {
    eth: {
        name: 'ETH & Derivatives',
        icon: 'E',
        symbols: ['ETH', 'WETH', 'stETH', 'wstETH', 'rETH', 'cbETH', 'sfrxETH', 'frxETH', 'EETH', 'weETH', 'mETH', 'oETH', 'ankrETH', 'swETH', 'ETHx', 'osETH', 'BETH']
    },
    gno: {
        name: 'GNO',
        icon: 'G',
        symbols: ['GNO', 'sGNO', 'LGNO']
    },
    stables: {
        name: 'Stablecoins',
        icon: '$',
        symbols: ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'sUSD', 'USDD', 'USDM', 'crvUSD', 'GHO', 'PYUSD', 'FDUSD', 'USD+', 'eUSD', 'USDe', 'sDAI', 'sUSDe', 'WXDAI', 'xDAI', 'EURe', 'EURS']
    },
    other: {
        name: 'Other',
        icon: 'O',
        symbols: []
    }
};

// Receipt tokens that represent protocol positions (to avoid double counting in DeBank)
// These appear in DeBank wallet tokens AND also in protocol positions (e.g., stETH in wallet + Lido protocol)
// We filter them from DeBank wallet tokens since they're already counted in protocol net_usd_value
// Note: sDAI is NOT filtered - it's only in wallet tokens, not double-counted in protocols
const RECEIPT_TOKENS = [
    'steth', 'wsteth', 'reth', 'cbeth', 'frxeth', 'sfrxeth', 'eeth', 'weeth',
    'meth', 'oeth', 'ankreth', 'sweth', 'ethx', 'oseth', 'beth',
    'susde', 'usde', 'saveusd',
    'aurabal', 'cvxcrv', 'sdbal',
    'agnowsteth', 'agno'  // Aave receipt tokens on Gnosis
];

// Check if a token is a receipt token (already counted in protocol)
function isReceiptToken(symbol, name) {
    const lowerSymbol = (symbol || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();
    return RECEIPT_TOKENS.some(r => lowerSymbol.includes(r) || lowerName.includes(r));
}

// Key tokens to show in holdings summary
const KEY_HOLDINGS = [
    { symbol: 'GNO', name: 'Gnosis', category: 'gno' },
    { symbol: 'ETH', name: 'Ethereum', category: 'eth', combine: ['ETH', 'WETH'] },
    { symbol: 'stETH', name: 'Lido Staked ETH', category: 'eth', combine: ['stETH', 'wstETH'] },
    { symbol: 'COW', name: 'CoW Protocol', category: 'other' },
    { symbol: 'SAFE', name: 'Safe Token', category: 'other' },
    { symbol: 'USDC', name: 'USD Coin', category: 'stables' },
    { symbol: 'DAI', name: 'Dai', category: 'stables', combine: ['DAI', 'sDAI', 'WXDAI'] },
    { symbol: 'USDT', name: 'Tether', category: 'stables' },
];

// DEX/LP protocol identifiers
const DEX_PROTOCOLS = ['uniswap', 'balancer', 'curve', 'sushiswap', 'pancakeswap', 'cowswap', 'cow swap'];
const STAKING_PROTOCOLS = ['lido', 'stader', 'stakewise', 'rocket pool', 'gnosis beacon', 'ether.fi', 'etherfi'];
const LENDING_PROTOCOLS = ['aave', 'compound', 'spark', 'maker', 'sky'];

// Human-readable wallet names based on primary holdings
const WALLET_NAMES = {
    '0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f': 'GNO Main Treasury',
    '0x849D52316331967b6fF1198e5E32A0eB168D039d': 'Token Holdings (GNO, SAFE, COW)',
    '0x509Ad7278A2F6530Bc24590C83E93fAF8fd46E99': 'Stables & Staking',
    '0xa5C629E04E563355c30885B62928fd6E03558548': 'ETH Staking',
    '0x15a954001BB47890a4c46A7FE9f06F7c39fF3D68': 'wstETH Primary',
    '0x4971DD016127F390a3EF6b956Ff944d0E2e1e462': 'COW & Mixed',
    '0x9065A0F9545817d18b58436771b4d87Bda8f008B': 'Aave Lending',
    '0x10E4597fF93cbee194F4879f8f1d54a370DB6969': 'Gnosis Chain Treasury',
    '0x2923c1B5313F7375fdaeE80b7745106deBC1b53E': 'LTF Holdings',
    '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe': 'COW Vesting',
    '0x5BE8aB1c28ee22Cdf9B136FEDa7D8f20876Bfc0F': 'Gnosis Chain Stables',
    '0x689d4bd36bc1938Af5cA2673c3c753235e3b4D2b': 'GNO Reserve',
    '0x399948eee21c5627Adb7De4A7EFe712245D48442': 'Swarm (BZZ)',
    '0x45a09fabD540b54f499212B3f579f0cF3393Ab6b': 'Swarm (BZZ) 2',
    '0x7eEa4286E9e82ba332F49400D037609BB1Cf00DA': 'GNO Small',
    '0x93EbF01356f44A1b0734081b0440bFf7bAcf72Ec': 'Swarm (BZZ) 3',
    '0x6bbe78ee9e474842dbd4ab4987b3cefe88426a92': 'xDAI Operations',
    '0x0668792caF78D5bad6cD0B8EcE032dFA7C11aC60': 'Swarm (BZZ) 4',
    '0xCdF50be9061086e2eCfE6e4a1BF9164d43568EEC': 'GNO Micro',
    '0x823A92aB789b15B88F43d798c332d6F38a32f0f6': 'Swarm (BZZ) 5',
    '0x813804d2D0820a6D8139946229BB840591bAEB47': 'Empty Wallet',
    '0x2Bd0563e3e2C55edDaBe4E469a02cA6652fB9e4A': 'Empty Wallet 2',
};

// Symbol normalization map - group related tokens for fair comparison
// Keys must be UPPERCASE since normalizeSymbol converts to uppercase first
const SYMBOL_NORMALIZATION = {
    // ETH variants (WETH is wrapped ETH, same value)
    'WETH': 'ETH',
    // Lido staked ETH - combine wstETH with stETH for comparison
    'WSTETH': 'STETH',
    'STETH': 'STETH',
    // DAI variants - sDAI is savings DAI with conversion rate to DAI (like wstETH to stETH)
    'WXDAI': 'DAI',
    'XDAI': 'DAI',
    'SDAI': 'DAI',
    // USDC variants
    'USDC.E': 'USDC',
};

// Normalize symbol for fair comparison
function normalizeSymbol(symbol) {
    const upper = (symbol || '').toUpperCase();
    return SYMBOL_NORMALIZATION[upper] || upper;
}

// Check if token is spam/scam
function isSpamToken(token) {
    const name = (token.name || '').toLowerCase();
    const symbol = (token.symbol || '').toLowerCase();

    // Check for spam indicators
    if (token.is_verified === false) return true;
    if (token.price === 0 || !token.price) return true;
    if (name.includes('http') || name.includes('www') || name.includes('.com') || name.includes('.org') || name.includes('.xyz')) return true;
    if (symbol.includes('http') || symbol.includes('www') || symbol.includes('.com') || symbol.includes('visit')) return true;
    if (name.includes('claim') || name.includes('reward') || name.includes('airdrop')) return true;
    if (name.length > 50) return true;
    if (symbol.length > 20) return true;

    return false;
}

// Pie chart colors
const PIE_COLORS = [
    '#627eea', // ETH blue
    '#3fb950', // Stables green
    '#f85149', // Red
    '#a371f7', // Purple
    '#d29922', // Yellow
    '#58a6ff', // Light blue
    '#8b949e', // Gray
    '#fe815f', // Orange
];

// Initialize the app
async function init() {
    showLoading();
    await loadData();
    await loadHistoricalIndex();
    processComparisonData();
    updateSummary();
    renderPieChart();
    renderKeyHoldings();
    renderCategoriesOverview();
    renderComparisonTable();
    renderWalletView();
    renderCategoryDetailView();
    renderHistoricalChart();
    setupEventListeners();
    hideLoading();
}

// Load both JSON data sources
async function loadData() {
    try {
        const [zerionResponse, debankResponse, metadataResponse] = await Promise.all([
            fetch('zerion_gnosis_dao_positions.json'),
            fetch('debank_balances_positions.json'),
            fetch('data_metadata.json').catch(() => null)
        ]);

        zerionData = await zerionResponse.json();
        debankData = await debankResponse.json();

        // Display data fetch timestamp
        if (metadataResponse && metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            const fetchedAt = new Date(metadata.fetched_at);
            document.getElementById('last-updated').textContent = fetchedAt.toLocaleString();
        } else {
            // Fallback: use file modification time approximation
            document.getElementById('last-updated').textContent = 'Unknown';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('comparison-body').innerHTML = `
            <tr><td colspan="6" class="empty-state">Error loading data files.</td></tr>
        `;
    }
}

// Get category for a symbol
function getCategory(symbol) {
    if (!symbol) return 'other';
    const upperSymbol = symbol.toUpperCase();

    // Handle Aave receipt tokens (aEth*, aGno*) - categorize by underlying asset
    if (upperSymbol.startsWith('AETH') || upperSymbol.startsWith('AGNO')) {
        // Extract underlying asset: aEthUSDC -> USDC, aEthWETH -> WETH, aEthDAI -> DAI
        const underlying = upperSymbol.replace(/^AETH|^AGNO/, '');
        if (['USDC', 'USDT', 'DAI', 'WXDAI', 'GHO'].includes(underlying)) return 'stables';
        if (['WETH', 'ETH', 'WSTETH', 'STETH'].includes(underlying)) return 'eth';
        if (underlying === 'GNO') return 'gno';
        return 'other';
    }

    for (const [category, config] of Object.entries(CATEGORIES)) {
        if (category === 'other') continue;
        if (config.symbols.some(s => upperSymbol.includes(s.toUpperCase()) || s.toUpperCase().includes(upperSymbol))) {
            return category;
        }
    }
    return 'other';
}

// Process and merge data from both sources
function processComparisonData() {
    const assetMap = new Map();

    // Process Zerion data
    for (const [wallet, positions] of Object.entries(zerionData)) {
        for (const position of positions) {
            const attrs = position.attributes || {};
            let symbol = attrs.fungible_info?.symbol || 'Unknown';
            const name = attrs.fungible_info?.name || attrs.name || symbol;
            const value = attrs.value || 0;
            const icon = attrs.fungible_info?.icon?.url || '';

            // Skip zero or very small values
            if (value < 1) continue;
            // Skip if explicitly marked as trash
            if (attrs.fungible_info?.flags?.is_trash) continue;
            // Skip obvious spam based on name patterns
            if (name.includes('.') && (name.includes('http') || name.includes('www') || name.length > 40)) continue;
            // Note: Don't filter receipt tokens from Zerion - they represent real holdings
            // We only filter from DeBank wallet tokens to avoid double-counting with protocols

            // CRITICAL FIX: Apply same protocol normalization as DeBank
            // Zerion reports protocol positions with attrs.protocol field
            const protocolName = attrs.protocol || '';
            const protocolLower = protocolName.toLowerCase();
            const isStakingProtocol = STAKING_PROTOCOLS.some(s => protocolLower.includes(s));
            const isLendingProtocol = LENDING_PROTOCOLS.some(l => protocolLower.includes(l));

            // Staking protocols: ETH -> STETH (Zerion reports ETH for Stader/Lido deposits)
            if (isStakingProtocol && (symbol.toUpperCase() === 'ETH' || symbol.toUpperCase() === 'WETH')) {
                symbol = 'STETH';
            }

            // Lending protocols: Map to receipt tokens (only if not already a receipt token)
            if (isLendingProtocol) {
                const upperSym = symbol.toUpperCase();
                if (upperSym === 'WETH' || upperSym === 'ETH') symbol = 'aEthWETH';
                else if (upperSym === 'DAI' || upperSym === 'WXDAI') symbol = 'aEthDAI';
                else if (upperSym === 'USDC' || upperSym === 'USDC.E') symbol = 'aEthUSDC';
                else if (upperSym === 'USDT') symbol = 'aEthUSDT';
            }

            // Use normalized symbol for grouping (WETH -> ETH, WXDAI -> DAI)
            const key = normalizeSymbol(symbol);
            const displaySymbol = key; // Use normalized symbol for display
            const displayName = SYMBOL_NORMALIZATION[symbol.toUpperCase()] ? `${name} (incl. ${symbol})` : name;

            if (!assetMap.has(key)) {
                assetMap.set(key, {
                    symbol: displaySymbol,
                    name: displayName,
                    icon,
                    category: getCategory(key),
                    zerionValue: 0,
                    debankValue: 0,
                    zerionQuantity: 0,
                    debankQuantity: 0,
                    zerionPositions: [],
                    debankPositions: [],
                    positionTypes: new Set(),
                    // Track value by position type for accurate filtering
                    valueByType: { 'wallet': 0, 'dex-lp': 0, 'staking': 0, 'lending': 0 }
                });
            }

            const asset = assetMap.get(key);
            const quantity = attrs.quantity?.float || 0;
            asset.zerionValue += value;
            asset.zerionQuantity += quantity;

            // Detect position type based on protocol or token characteristics
            let posType = 'wallet';
            const isDexProtocol = DEX_PROTOCOLS.some(dex => protocolLower.includes(dex));
            if (isDexProtocol) {
                posType = 'dex-lp';
            } else if (isStakingProtocol) {
                posType = 'staking';
            } else if (isLendingProtocol) {
                posType = 'lending';
            } else if (isReceiptToken(symbol, name)) {
                posType = 'staking';
            }

            asset.zerionPositions.push({ wallet, value, quantity, positionType: posType, walletName: WALLET_NAMES[wallet] || 'Unknown' });
            asset.positionTypes.add(posType);
            asset.valueByType[posType] = (asset.valueByType[posType] || 0) + value;
        }
    }

    // Process DeBank data - tokens
    for (const [wallet, data] of Object.entries(debankData)) {
        const tokens = data.tokens || [];
        const protocols = data.protocols || [];

        for (const token of tokens) {
            const symbol = token.symbol || 'Unknown';
            const name = token.name || symbol;
            const value = (token.amount || 0) * (token.price || 0);
            const icon = token.logo_url || '';

            // Skip zero values and spam tokens using improved spam detection
            if (value < 1) continue;
            if (isSpamToken(token)) continue;
            // Skip receipt tokens - they are already counted in protocol positions (avoid double counting)
            if (isReceiptToken(symbol, name)) continue;

            // Use normalized symbol for grouping
            const key = normalizeSymbol(symbol);
            const displaySymbol = key;
            const displayName = SYMBOL_NORMALIZATION[symbol.toUpperCase()] ? `${name} (incl. ${symbol})` : name;

            if (!assetMap.has(key)) {
                assetMap.set(key, {
                    symbol: displaySymbol,
                    name: displayName,
                    icon,
                    category: getCategory(key),
                    zerionValue: 0,
                    debankValue: 0,
                    zerionQuantity: 0,
                    debankQuantity: 0,
                    zerionPositions: [],
                    debankPositions: [],
                    positionTypes: new Set(),
                    valueByType: { 'wallet': 0, 'dex-lp': 0, 'staking': 0, 'lending': 0 }
                });
            }

            const asset = assetMap.get(key);
            const quantity = token.amount || 0;
            asset.debankValue += value;
            asset.debankQuantity += quantity;
            asset.debankPositions.push({ wallet, value, quantity, source: 'token', positionType: 'wallet', walletName: WALLET_NAMES[wallet] || 'Unknown' });
            asset.positionTypes.add('wallet'); // Token holdings are wallet positions
            asset.valueByType['wallet'] = (asset.valueByType['wallet'] || 0) + value;
        }

        // Process DeBank protocol positions
        for (const protocol of protocols) {
            const protocolName = protocol.name || 'Unknown Protocol';
            const protocolLower = protocolName.toLowerCase();
            const items = protocol.portfolio_item_list || [];

            // Determine position type based on protocol
            let positionType = 'wallet';
            if (DEX_PROTOCOLS.some(dex => protocolLower.includes(dex))) {
                positionType = 'dex-lp';
            } else if (STAKING_PROTOCOLS.some(s => protocolLower.includes(s))) {
                positionType = 'staking';
            } else if (LENDING_PROTOCOLS.some(l => protocolLower.includes(l))) {
                positionType = 'lending';
            }

            for (const item of items) {
                const tokenList = item.asset_token_list || [];

                for (const token of tokenList) {
                    let symbol = token.symbol || 'Unknown';
                    const name = token.name || symbol;
                    const value = (token.amount || 0) * (token.price || 0);
                    const icon = token.logo_url || '';

                    if (value < 1) continue;

                    // CRITICAL FIX: Normalize protocol-reported underlying tokens to match Zerion's representation
                    const isStakingProtocol = STAKING_PROTOCOLS.some(s => protocolLower.includes(s));
                    const isLendingProtocol = LENDING_PROTOCOLS.some(l => protocolLower.includes(l));

                    // Staking protocols: ETH -> STETH (DeBank reports ETH for Lido/Stader, Zerion reports stETH/wstETH)
                    if (isStakingProtocol && (symbol.toUpperCase() === 'ETH' || symbol.toUpperCase() === 'WETH')) {
                        symbol = 'STETH';
                    }

                    // Lending protocols: Map to Aave receipt tokens (DeBank reports WETH/DAI/USDC, Zerion reports aEthWETH/aEthDAI/etc)
                    if (isLendingProtocol) {
                        const upperSym = symbol.toUpperCase();
                        if (upperSym === 'WETH' || upperSym === 'ETH') symbol = 'aEthWETH';
                        else if (upperSym === 'DAI' || upperSym === 'WXDAI') symbol = 'aEthDAI';
                        else if (upperSym === 'USDC' || upperSym === 'USDC.E') symbol = 'aEthUSDC';
                        else if (upperSym === 'USDT') symbol = 'aEthUSDT';
                    }

                    // Use normalized symbol for grouping
                    const key = normalizeSymbol(symbol);
                    const displaySymbol = key;
                    const displayName = SYMBOL_NORMALIZATION[symbol.toUpperCase()] ? `${name} (incl. ${symbol})` : name;

                    if (!assetMap.has(key)) {
                        assetMap.set(key, {
                            symbol: displaySymbol,
                            name: displayName,
                            icon,
                            category: getCategory(key),
                            zerionValue: 0,
                            debankValue: 0,
                            zerionQuantity: 0,
                            debankQuantity: 0,
                            zerionPositions: [],
                            debankPositions: [],
                            positionTypes: new Set(),
                            valueByType: { 'wallet': 0, 'dex-lp': 0, 'staking': 0, 'lending': 0 }
                        });
                    }

                    const asset = assetMap.get(key);
                    const quantity = token.amount || 0;
                    asset.debankValue += value;
                    asset.debankQuantity += quantity;
                    asset.valueByType[positionType] = (asset.valueByType[positionType] || 0) + value;
                    asset.debankPositions.push({
                        wallet,
                        value,
                        quantity,
                        source: 'protocol',
                        protocol: protocolName,
                        positionType,
                        walletName: WALLET_NAMES[wallet] || 'Unknown'
                    });
                    asset.positionTypes.add(positionType);
                }
            }
        }
    }

    // Convert to array and calculate differences
    comparisonData = Array.from(assetMap.values()).map(asset => ({
        ...asset,
        positionTypes: asset.positionTypes, // Keep the Set as is for filtering
        avgValue: (asset.zerionValue + asset.debankValue) / 2,
        difference: asset.zerionValue - asset.debankValue,
        diffPercent: asset.debankValue > 0
            ? ((asset.zerionValue - asset.debankValue) / asset.debankValue) * 100
            : (asset.zerionValue > 0 ? 100 : 0)
    }));

    // Sort by average value
    comparisonData.sort((a, b) => b.avgValue - a.avgValue);
    filteredData = [...comparisonData];
}

// Constants
const GNO_TOTAL_SUPPLY = 3000000;
const LTD_GNO_ADDRESS = '0x604e4557e9020841f4e8eb98148de3d3cdea350c';

// Cache for Ltd. GNO balance (fetched dynamically)
let ltdGnoCache = null;

// Fetch GNO balance for Ltd. address from pre-fetched JSON file
async function fetchLtdGnoBalance() {
    if (ltdGnoCache !== null) {
        return ltdGnoCache;
    }

    try {
        const response = await fetch('ltd_gno_balance.json');
        if (!response.ok) {
            throw new Error(`Failed to load ltd_gno_balance.json: ${response.status}`);
        }

        const data = await response.json();
        ltdGnoCache = data.gno_balance || 0;
        console.log(`Loaded Ltd. GNO balance: ${ltdGnoCache.toLocaleString()} GNO (fetched: ${data.fetched_at})`);
        return ltdGnoCache;
    } catch (error) {
        console.error('Error loading Ltd. GNO balance:', error);
        // Fallback value if file doesn't exist
        ltdGnoCache = 360411;
        return ltdGnoCache;
    }
}

// Update summary cards
function updateSummary() {
    // Calculate totals from raw data (not filtered comparison data)
    let zerionTotal = 0;
    for (const [wallet, positions] of Object.entries(zerionData)) {
        for (const pos of positions) {
            const attrs = pos.attributes || {};
            if (attrs.fungible_info?.flags?.is_trash) continue;
            const name = attrs.fungible_info?.name || '';
            if (name.includes('.') && (name.includes('http') || name.includes('www') || name.length > 40)) continue;
            zerionTotal += attrs.value || 0;
        }
    }

    let debankTotal = 0;
    for (const [wallet, data] of Object.entries(debankData)) {
        // Tokens (excluding receipts to avoid double count with protocols)
        for (const token of data.tokens || []) {
            if (isSpamToken(token)) continue;
            if (isReceiptToken(token.symbol, token.name)) continue;
            debankTotal += (token.amount || 0) * (token.price || 0);
        }
        // Protocols
        for (const protocol of data.protocols || []) {
            for (const item of protocol.portfolio_item_list || []) {
                debankTotal += item.stats?.net_usd_value || 0;
            }
        }
    }

    const difference = zerionTotal - debankTotal;
    const diffPercent = debankTotal > 0 ? (difference / debankTotal) * 100 : 0;

    document.getElementById('zerion-total').textContent = formatCurrency(zerionTotal);
    document.getElementById('debank-total').textContent = formatCurrency(debankTotal);

    // Calculate NAV per GNO
    updateNAV();

    const zerionPositions = Object.values(zerionData).reduce((sum, positions) => sum + positions.length, 0);
    const debankTokens = Object.values(debankData).reduce((sum, data) => sum + (data.tokens?.length || 0), 0);
    const debankProtocols = Object.values(debankData).reduce((sum, data) => sum + (data.protocols?.length || 0), 0);

    document.getElementById('zerion-positions').textContent = `${zerionPositions} positions`;
    document.getElementById('debank-positions').textContent = `${debankTokens} tokens, ${debankProtocols} protocols`;

    const diffEl = document.getElementById('diff-value');
    const diffPercentEl = document.getElementById('diff-percent');

    diffEl.textContent = `${difference >= 0 ? '+' : ''}${formatCurrency(difference)}`;
    diffEl.className = `card-value ${difference >= 0 ? 'diff-positive' : 'diff-negative'}`;
    diffPercentEl.textContent = `${difference >= 0 ? '+' : ''}${diffPercent.toFixed(2)}% ${difference >= 0 ? 'Zerion higher' : 'DeBank higher'}`;
}

// Update NAV per GNO calculation
async function updateNAV() {
    const excludeLtd = document.getElementById('exclude-ltd-gno')?.checked || false;

    // Calculate GNO holdings and value from Zerion (more reliable)
    let daoGnoQuantity = 0;
    let daoGnoValue = 0;
    let totalPortfolioValue = 0;

    for (const [wallet, positions] of Object.entries(zerionData)) {
        for (const pos of positions) {
            const attrs = pos.attributes || {};
            const sym = (attrs.fungible_info?.symbol || '').toUpperCase();
            const qty = attrs.quantity?.float || 0;
            const val = attrs.value || 0;

            // Skip trash/spam
            if (attrs.fungible_info?.flags?.is_trash) continue;
            const name = attrs.fungible_info?.name || '';
            if (name.includes('.') && (name.includes('http') || name.includes('www') || name.length > 40)) continue;

            totalPortfolioValue += val;

            if (sym === 'GNO') {
                daoGnoQuantity += qty;
                daoGnoValue += val;
            }
        }
    }

    // If excluding Ltd. GNO, fetch the balance and remove from circulating supply
    let ltdGnoExclusion = 0;
    if (excludeLtd) {
        // Show loading state
        document.getElementById('nav-per-gno').textContent = 'Loading...';
        ltdGnoExclusion = await fetchLtdGnoBalance();
    }
    const effectiveSupply = GNO_TOTAL_SUPPLY - ltdGnoExclusion;

    const outstandingGno = effectiveSupply - daoGnoQuantity;
    const nonGnoValue = totalPortfolioValue - daoGnoValue;
    const navPerGno = outstandingGno > 0 ? nonGnoValue / outstandingGno : 0;

    // Update DOM
    document.getElementById('nav-per-gno').textContent = '$' + navPerGno.toFixed(2);
    document.getElementById('dao-gno').textContent = formatQuantity(daoGnoQuantity) + ' GNO';
    document.getElementById('outstanding-gno').textContent = formatQuantity(outstandingGno) + ' GNO' + (excludeLtd ? ` (excl. ${formatQuantity(ltdGnoExclusion)} Ltd.)` : '');
    document.getElementById('non-gno-value').textContent = formatCurrency(nonGnoValue);
    document.getElementById('gno-supply').textContent = formatQuantity(effectiveSupply) + (excludeLtd ? ' (excl. Ltd.)' : '');
}

// Render pie chart of non-GNO holdings
function renderPieChart() {
    const canvas = document.getElementById('portfolio-pie');
    const ctx = canvas.getContext('2d');
    const legend = document.getElementById('pie-legend');

    // Calculate non-GNO holdings by category
    const categoryValues = {
        'ETH & Derivatives': 0,
        'Stablecoins': 0,
        'COW': 0,
        'SAFE': 0,
        'Other': 0
    };

    for (const [wallet, positions] of Object.entries(zerionData)) {
        for (const pos of positions) {
            const attrs = pos.attributes || {};
            if (attrs.fungible_info?.flags?.is_trash) continue;
            const name = attrs.fungible_info?.name || '';
            if (name.includes('.') && (name.includes('http') || name.includes('www') || name.length > 40)) continue;

            const symbol = (attrs.fungible_info?.symbol || '').toUpperCase();
            const value = attrs.value || 0;

            // Skip GNO
            if (symbol === 'GNO') continue;

            // Categorize
            if (symbol === 'COW') {
                categoryValues['COW'] += value;
            } else if (symbol === 'SAFE') {
                categoryValues['SAFE'] += value;
            } else if (getCategory(symbol) === 'eth') {
                categoryValues['ETH & Derivatives'] += value;
            } else if (getCategory(symbol) === 'stables') {
                categoryValues['Stablecoins'] += value;
            } else {
                categoryValues['Other'] += value;
            }
        }
    }

    // Prepare data for pie chart
    const data = Object.entries(categoryValues)
        .filter(([_, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

    const total = data.reduce((sum, [_, v]) => sum + v, 0);

    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    let startAngle = -Math.PI / 2; // Start at top

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach(([label, value], i) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 2;
        ctx.stroke();

        startAngle = endAngle;
    });

    // Draw center circle (donut effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#161b22';
    ctx.fill();

    // Draw total in center
    ctx.fillStyle = '#f0f6fc';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCurrency(total), centerX, centerY - 8);
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.fillText('Non-GNO', centerX, centerY + 10);

    // Render legend
    legend.innerHTML = data.map(([label, value], i) => {
        const percent = ((value / total) * 100).toFixed(1);
        return `
            <div class="legend-item">
                <span class="legend-color" style="background: ${PIE_COLORS[i % PIE_COLORS.length]}"></span>
                <span class="legend-label">${label}</span>
                <span class="legend-value">${percent}%</span>
            </div>
        `;
    }).join('');
}

// Render key holdings with absolute quantities
function renderKeyHoldings() {
    const grid = document.getElementById('holdings-grid');

    // Calculate quantities from Zerion data (more reliable for quantities)
    const holdings = KEY_HOLDINGS.map(config => {
        const symbols = config.combine || [config.symbol];
        let totalQuantity = 0;
        let totalValue = 0;
        let icon = '';

        for (const [wallet, positions] of Object.entries(zerionData)) {
            for (const pos of positions) {
                const attrs = pos.attributes || {};
                const sym = (attrs.fungible_info?.symbol || '').toUpperCase();
                const value = attrs.value || 0;

                if (symbols.some(s => sym === s.toUpperCase())) {
                    // Only count positions with actual value (price > 0)
                    // This excludes locked/vested tokens with $0 price
                    if (value > 0) {
                        totalQuantity += attrs.quantity?.float || 0;
                    }
                    totalValue += value;
                    if (!icon && attrs.fungible_info?.icon?.url) {
                        icon = attrs.fungible_info.icon.url;
                    }
                }
            }
        }

        return {
            ...config,
            icon,
            quantity: totalQuantity,
            value: totalValue
        };
    });

    grid.innerHTML = holdings.map(h => `
        <div class="holding-card">
            ${h.icon ? `<img src="${h.icon}" alt="${h.symbol}" class="holding-icon" onerror="this.style.display='none'">` : `<div class="holding-icon category-icon ${h.category}">${h.symbol[0]}</div>`}
            <div class="holding-info">
                <div class="holding-symbol">${h.symbol}</div>
                <div class="holding-name">${h.name}</div>
            </div>
            <div class="holding-values">
                <div class="holding-quantity">${formatTokenQuantity(h.quantity, h.symbol)}</div>
                <div class="holding-usd">${formatCurrency(h.value)}</div>
            </div>
        </div>
    `).join('');
}

// Format token quantity with appropriate precision
function formatTokenQuantity(quantity, symbol) {
    // For large quantities (like COW, SAFE)
    if (quantity >= 1000000000) {
        return (quantity / 1000000000).toFixed(2) + 'B';
    } else if (quantity >= 1000000) {
        return (quantity / 1000000).toFixed(2) + 'M';
    } else if (quantity >= 1000) {
        return (quantity / 1000).toFixed(1) + 'K';
    } else if (quantity >= 1) {
        return quantity.toFixed(2);
    } else if (quantity > 0) {
        return quantity.toFixed(4);
    }
    return '0';
}

// Render categories overview
function renderCategoriesOverview() {
    const categoryTotals = {};
    const totalValue = comparisonData.reduce((sum, a) => sum + a.avgValue, 0);

    for (const category of Object.keys(CATEGORIES)) {
        categoryTotals[category] = {
            zerion: 0,
            debank: 0,
            count: 0
        };
    }

    for (const asset of comparisonData) {
        const cat = asset.category;
        categoryTotals[cat].zerion += asset.zerionValue;
        categoryTotals[cat].debank += asset.debankValue;
        categoryTotals[cat].count++;
    }

    const grid = document.getElementById('categories-grid');
    grid.innerHTML = Object.entries(CATEGORIES).map(([key, config]) => {
        const totals = categoryTotals[key];
        const avgTotal = (totals.zerion + totals.debank) / 2;
        const percent = totalValue > 0 ? (avgTotal / totalValue) * 100 : 0;

        return `
            <div class="category-card" data-category="${key}">
                <div class="category-info">
                    <div class="category-icon ${key}">${config.icon}</div>
                    <div>
                        <div class="category-name">${config.name}</div>
                        <div class="category-count">${totals.count} assets</div>
                    </div>
                </div>
                <div class="category-values">
                    <div class="category-total">${formatCurrency(avgTotal)}</div>
                    <div class="category-percent">${percent.toFixed(1)}% of portfolio</div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to filter by category
    grid.querySelectorAll('.category-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            document.getElementById('category-filter').value = card.dataset.category;
            applyFilters();
        });
    });
}

// Render comparison table
function renderComparisonTable() {
    const tbody = document.getElementById('comparison-body');

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No assets found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredData.map((asset, index) => {
        const diffClass = Math.abs(asset.diffPercent) < 1 ? 'diff-zero'
            : (asset.difference >= 0 ? 'diff-positive' : 'diff-negative');

        // Use average quantity for display
        const avgQuantity = (asset.zerionQuantity + asset.debankQuantity) / 2;

        // Build wallet breakdown HTML
        const walletBreakdown = buildWalletBreakdown(asset);

        return `
            <tr class="asset-row" onclick="toggleAssetDetail(${index})">
                <td>
                    <div class="asset-cell">
                        ${asset.icon ? `<img src="${asset.icon}" alt="${asset.symbol}" class="asset-icon" onerror="this.style.display='none'">` : ''}
                        <div class="asset-info">
                            <span class="asset-name">${asset.name}</span>
                            <span class="asset-symbol">${asset.symbol}</span>
                        </div>
                        <span class="expand-icon">▶</span>
                    </div>
                </td>
                <td><span class="category-badge ${asset.category}">${CATEGORIES[asset.category].name}</span></td>
                <td class="number quantity-cell">${formatQuantity(avgQuantity)}</td>
                <td class="number value-zerion">${formatCurrency(asset.zerionValue)}</td>
                <td class="number value-debank">${formatCurrency(asset.debankValue)}</td>
                <td class="number ${diffClass}">${asset.difference >= 0 ? '+' : ''}${formatCurrency(asset.difference)}</td>
                <td class="number ${diffClass}">${asset.diffPercent >= 0 ? '+' : ''}${asset.diffPercent.toFixed(1)}%</td>
            </tr>
            <tr class="asset-detail-row" id="asset-detail-${index}">
                <td colspan="7">
                    <div class="wallet-breakdown">
                        <h4>Wallet Breakdown for ${asset.symbol}</h4>
                        ${walletBreakdown}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Build wallet breakdown HTML for an asset
function buildWalletBreakdown(asset) {
    // Combine positions from both sources by wallet
    const walletMap = new Map();

    for (const pos of asset.zerionPositions || []) {
        if (!walletMap.has(pos.wallet)) {
            walletMap.set(pos.wallet, { wallet: pos.wallet, walletName: pos.walletName, zerionQty: 0, zerionVal: 0, debankQty: 0, debankVal: 0 });
        }
        const w = walletMap.get(pos.wallet);
        w.zerionQty += pos.quantity;
        w.zerionVal += pos.value;
    }

    for (const pos of asset.debankPositions || []) {
        if (!walletMap.has(pos.wallet)) {
            walletMap.set(pos.wallet, { wallet: pos.wallet, walletName: pos.walletName, zerionQty: 0, zerionVal: 0, debankQty: 0, debankVal: 0 });
        }
        const w = walletMap.get(pos.wallet);
        w.debankQty += pos.quantity;
        w.debankVal += pos.value;
    }

    // Sort by average value
    const wallets = Array.from(walletMap.values()).sort((a, b) =>
        (b.zerionVal + b.debankVal) - (a.zerionVal + a.debankVal)
    );

    if (wallets.length === 0) {
        return '<p class="no-wallets">No wallet data available</p>';
    }

    return `
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Wallet</th>
                    <th class="number">Quantity</th>
                    <th class="number">Zerion Value</th>
                    <th class="number">DeBank Value</th>
                </tr>
            </thead>
            <tbody>
                ${wallets.map(w => `
                    <tr>
                        <td>
                            <div class="breakdown-wallet">
                                <span class="breakdown-wallet-name">${w.walletName}</span>
                                <span class="breakdown-wallet-addr">${w.wallet.slice(0, 6)}...${w.wallet.slice(-4)}</span>
                            </div>
                        </td>
                        <td class="number">${formatQuantity((w.zerionQty + w.debankQty) / 2)}</td>
                        <td class="number value-zerion">
                            <a href="https://app.zerion.io/${w.wallet}/overview" target="_blank" class="value-link zerion-link">${formatCurrency(w.zerionVal)}</a>
                        </td>
                        <td class="number value-debank">
                            <a href="https://debank.com/profile/${w.wallet}" target="_blank" class="value-link debank-link">${formatCurrency(w.debankVal)}</a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Toggle asset detail row
function toggleAssetDetail(index) {
    const detailRow = document.getElementById(`asset-detail-${index}`);
    const assetRow = detailRow.previousElementSibling;

    detailRow.classList.toggle('expanded');
    assetRow.classList.toggle('expanded');
}

// Render wallet view
function renderWalletView() {
    const container = document.getElementById('wallets-container');
    const allWallets = new Set([...Object.keys(zerionData), ...Object.keys(debankData)]);

    const walletData = Array.from(allWallets).map(wallet => {
        // Calculate Zerion total for wallet
        const zerionPositions = zerionData[wallet] || [];
        const zerionTotal = zerionPositions.reduce((sum, p) => {
            const val = p.attributes?.value || 0;
            const isTrash = p.attributes?.fungible_info?.flags?.is_trash;
            const name = p.attributes?.fungible_info?.name || '';
            const isSpam = name.includes('.') && (name.includes('http') || name.includes('www') || name.length > 40);
            return (!isTrash && !isSpam) ? sum + val : sum;
        }, 0);

        // Calculate DeBank total for wallet
        const debankInfo = debankData[wallet] || { tokens: [], protocols: [] };
        let debankTotal = 0;

        for (const token of debankInfo.tokens || []) {
            if (token.is_verified !== false && token.price > 0) {
                // Skip receipt tokens - they are counted in protocol positions
                if (isReceiptToken(token.symbol, token.name)) continue;
                debankTotal += (token.amount || 0) * (token.price || 0);
            }
        }

        for (const protocol of debankInfo.protocols || []) {
            for (const item of protocol.portfolio_item_list || []) {
                debankTotal += item.stats?.net_usd_value || 0;
            }
        }

        return { wallet, zerionTotal, debankTotal };
    }).sort((a, b) => Math.max(b.zerionTotal, b.debankTotal) - Math.max(a.zerionTotal, a.debankTotal));

    container.innerHTML = walletData.map(w => {
        const walletName = WALLET_NAMES[w.wallet] || 'Unknown Wallet';
        return `
        <div class="wallet-card">
            <div class="wallet-header" onclick="toggleCard(this)">
                <div class="wallet-identity">
                    <span class="wallet-name">${walletName}</span>
                    <span class="wallet-address">${truncateAddress(w.wallet)}</span>
                </div>
                <div class="wallet-values">
                    <div class="source-value">
                        <div class="source-label">Zerion</div>
                        <a href="https://app.zerion.io/${w.wallet}/overview" target="_blank" class="source-amount zerion value-link" onclick="event.stopPropagation()">${formatCurrency(w.zerionTotal)}</a>
                    </div>
                    <div class="source-value">
                        <div class="source-label">DeBank</div>
                        <a href="https://debank.com/profile/${w.wallet}" target="_blank" class="source-amount debank value-link" onclick="event.stopPropagation()">${formatCurrency(w.debankTotal)}</a>
                    </div>
                </div>
            </div>
            <div class="wallet-positions">
                ${renderWalletPositions(w.wallet)}
            </div>
        </div>
    `}).join('');
}

// Render positions for a specific wallet
function renderWalletPositions(wallet) {
    const positions = [];

    // Add Zerion positions
    for (const pos of zerionData[wallet] || []) {
        const attrs = pos.attributes || {};
        // Skip trash and spam
        if (attrs.fungible_info?.flags?.is_trash) continue;
        const name = attrs.fungible_info?.name || '';
        if (name.includes('.') && (name.includes('http') || name.includes('www') || name.length > 40)) continue;
        positions.push({
            symbol: attrs.fungible_info?.symbol || 'Unknown',
            name: attrs.fungible_info?.name || 'Unknown',
            icon: attrs.fungible_info?.icon?.url || '',
            zerionValue: attrs.value || 0,
            debankValue: 0,
            quantity: attrs.quantity?.float || 0
        });
    }

    // Add/merge DeBank positions
    const debankInfo = debankData[wallet] || { tokens: [], protocols: [] };

    for (const token of debankInfo.tokens || []) {
        if (token.is_verified === false || !token.price) continue;
        // Skip receipt tokens - they are counted in protocol positions
        if (isReceiptToken(token.symbol, token.name)) continue;
        const value = (token.amount || 0) * (token.price || 0);
        if (value < 1) continue;

        const existing = positions.find(p => p.symbol.toUpperCase() === (token.symbol || '').toUpperCase());
        if (existing) {
            existing.debankValue = value;
        } else {
            positions.push({
                symbol: token.symbol || 'Unknown',
                name: token.name || 'Unknown',
                icon: token.logo_url || '',
                zerionValue: 0,
                debankValue: value,
                quantity: token.amount || 0
            });
        }
    }

    positions.sort((a, b) => Math.max(b.zerionValue, b.debankValue) - Math.max(a.zerionValue, a.debankValue));

    return positions.slice(0, 20).map(p => `
        <div class="position-item">
            <div class="position-asset">
                ${p.icon ? `<img src="${p.icon}" alt="${p.symbol}" class="position-icon" onerror="this.style.display='none'">` : ''}
                <div>
                    <div class="position-name">${p.symbol}</div>
                    <div class="position-symbol">${formatQuantity(p.quantity)}</div>
                </div>
            </div>
            <div class="position-value value-zerion">${formatCurrency(p.zerionValue)}</div>
            <div class="position-value value-debank">${formatCurrency(p.debankValue)}</div>
            <div class="position-value ${Math.abs(p.zerionValue - p.debankValue) < 1 ? 'diff-zero' : (p.zerionValue > p.debankValue ? 'diff-positive' : 'diff-negative')}">
                ${p.zerionValue - p.debankValue >= 0 ? '+' : ''}${formatCurrency(p.zerionValue - p.debankValue)}
            </div>
        </div>
    `).join('');
}

// Render category detail view
function renderCategoryDetailView() {
    const container = document.getElementById('category-details-container');

    container.innerHTML = Object.entries(CATEGORIES).map(([key, config]) => {
        const categoryAssets = comparisonData.filter(a => a.category === key);
        const zerionTotal = categoryAssets.reduce((sum, a) => sum + a.zerionValue, 0);
        const debankTotal = categoryAssets.reduce((sum, a) => sum + a.debankValue, 0);

        return `
            <div class="category-detail-card">
                <div class="category-detail-header" onclick="toggleCard(this)">
                    <div class="category-info">
                        <div class="category-icon ${key}">${config.icon}</div>
                        <div>
                            <div class="category-name">${config.name}</div>
                            <div class="category-count">${categoryAssets.length} assets</div>
                        </div>
                    </div>
                    <div class="category-detail-values">
                        <div class="source-value">
                            <div class="source-label">Zerion</div>
                            <div class="source-amount zerion">${formatCurrency(zerionTotal)}</div>
                        </div>
                        <div class="source-value">
                            <div class="source-label">DeBank</div>
                            <div class="source-amount debank">${formatCurrency(debankTotal)}</div>
                        </div>
                    </div>
                </div>
                <div class="category-detail-positions">
                    ${categoryAssets.slice(0, 30).map(a => `
                        <div class="position-item">
                            <div class="position-asset">
                                ${a.icon ? `<img src="${a.icon}" alt="${a.symbol}" class="position-icon" onerror="this.style.display='none'">` : ''}
                                <div>
                                    <div class="position-name">${a.symbol}</div>
                                    <div class="position-symbol">${a.name}</div>
                                </div>
                            </div>
                            <div class="position-value value-zerion">${formatCurrency(a.zerionValue)}</div>
                            <div class="position-value value-debank">${formatCurrency(a.debankValue)}</div>
                            <div class="position-value ${Math.abs(a.diffPercent) < 1 ? 'diff-zero' : (a.difference >= 0 ? 'diff-positive' : 'diff-negative')}">
                                ${a.difference >= 0 ? '+' : ''}${a.diffPercent.toFixed(1)}%
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('search').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('source-filter').addEventListener('change', applyFilters);
    document.getElementById('category-filter').addEventListener('change', applyFilters);
    document.getElementById('position-type-filter').addEventListener('change', applyFilters);
    document.getElementById('match-quality-filter').addEventListener('change', applyFilters);
    document.getElementById('sort-by').addEventListener('change', applyFilters);

    // NAV options
    document.getElementById('exclude-ltd-gno').addEventListener('change', updateNAV);

    // Historical chart controls
    document.getElementById('chart-asset-select')?.addEventListener('change', renderHistoricalChart);
    document.getElementById('chart-timeframe')?.addEventListener('change', renderHistoricalChart);
    document.getElementById('load-snapshot-btn')?.addEventListener('click', () => {
        const date = document.getElementById('snapshot-date-select').value;
        loadSnapshot(date);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const view = e.target.dataset.view;
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${view}-view`).classList.add('active');
        });
    });
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const sourceFilter = document.getElementById('source-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const positionTypeFilter = document.getElementById('position-type-filter').value;
    const matchQualityFilter = document.getElementById('match-quality-filter').value;
    const sortBy = document.getElementById('sort-by').value;

    filteredData = comparisonData.filter(asset => {
        // Search filter
        if (searchTerm) {
            const matchesSearch = asset.symbol.toLowerCase().includes(searchTerm) ||
                                  asset.name.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }

        // Source filter
        if (sourceFilter === 'zerion' && asset.zerionValue === 0) return false;
        if (sourceFilter === 'debank' && asset.debankValue === 0) return false;

        // Category filter
        if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;

        // Position type filter - require meaningful value in that position type
        if (positionTypeFilter !== 'all') {
            const typeValue = asset.valueByType?.[positionTypeFilter] || 0;
            // Must have at least $100 in this position type
            if (typeValue < 100) {
                return false;
            }
        }

        // Match quality filter - based on % difference
        if (matchQualityFilter !== 'all') {
            const absDiffPct = Math.abs(asset.diffPercent);
            // Need both sources to have values for meaningful comparison
            const hasBothSources = asset.zerionValue > 0 && asset.debankValue > 0;

            if (matchQualityFilter === 'comparable') {
                // Comparable: both sources have values AND diff < 50% AND not a protocol-specific token
                // Exclude tokens that are inherently uncomparable due to API representation differences
                const isUncomparable = isReceiptToken(asset.symbol, asset.name) ||
                    asset.symbol.includes('-') || // LP tokens like "BCOW-50GNO-50COW"
                    asset.symbol.startsWith('SP') || // Spark tokens
                    asset.symbol.startsWith('AETH'); // Aave tokens
                if (!hasBothSources || absDiffPct >= 50 || isUncomparable) return false;
            } else if (matchQualityFilter === 'matched') {
                // Well matched: both sources have values AND diff < 20%
                if (!hasBothSources || absDiffPct >= 20) return false;
            } else if (matchQualityFilter === 'mismatched') {
                // Mismatched: large diff OR only one source has value
                if (hasBothSources && absDiffPct < 20) return false;
            }
        }

        return true;
    });

    // Sort
    switch (sortBy) {
        case 'value-desc':
            filteredData.sort((a, b) => b.avgValue - a.avgValue);
            break;
        case 'value-asc':
            filteredData.sort((a, b) => a.avgValue - b.avgValue);
            break;
        case 'diff-desc':
            filteredData.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
            break;
        case 'name-asc':
            filteredData.sort((a, b) => a.symbol.localeCompare(b.symbol));
            break;
    }

    renderComparisonTable();
}

// Toggle card expansion
function toggleCard(header) {
    const card = header.parentElement;
    card.classList.toggle('expanded');
}

// Utility functions
function formatCurrency(value) {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000000) {
        return sign + '$' + (absValue / 1000000000).toFixed(2) + 'B';
    } else if (absValue >= 1000000) {
        return sign + '$' + (absValue / 1000000).toFixed(2) + 'M';
    } else if (absValue >= 1000) {
        return sign + '$' + (absValue / 1000).toFixed(2) + 'K';
    }
    return sign + '$' + absValue.toFixed(2);
}

function formatQuantity(quantity) {
    if (quantity >= 1000000000) {
        return (quantity / 1000000000).toFixed(2) + 'B';
    } else if (quantity >= 1000000) {
        return (quantity / 1000000).toFixed(2) + 'M';
    } else if (quantity >= 1000) {
        return (quantity / 1000).toFixed(2) + 'K';
    } else if (quantity < 0.01 && quantity > 0) {
        return quantity.toExponential(2);
    }
    return quantity.toFixed(2);
}

function truncateAddress(address) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    document.getElementById('comparison-body').innerHTML = `
        <tr><td colspan="6" class="loading">
            <div class="loading-spinner"></div>
            Loading treasury data from Zerion and DeBank...
        </td></tr>
    `;
}

function hideLoading() {
    // Loading is hidden when data is rendered
}

// ============================================
// HISTORICAL DATA & CHARTS
// ============================================

// Load historical index
async function loadHistoricalIndex() {
    try {
        const response = await fetch('archive/index.json');
        if (response.ok) {
            historicalIndex = await response.json();
            populateSnapshotSelector();
            populateAssetSelector();
        }
    } catch (error) {
        console.log('No historical data available yet');
        historicalIndex = { snapshots: [] };
    }
}

// Populate snapshot date selector
function populateSnapshotSelector() {
    const select = document.getElementById('snapshot-date-select');
    if (!select || !historicalIndex) return;

    select.innerHTML = '<option value="current">Current (Latest)</option>';
    for (const snapshot of historicalIndex.snapshots) {
        const option = document.createElement('option');
        option.value = snapshot.date;
        option.textContent = snapshot.date;
        select.appendChild(option);
    }
}

// Populate asset selector for charts
async function populateAssetSelector() {
    const select = document.getElementById('chart-asset-select');
    if (!select || !historicalIndex || historicalIndex.snapshots.length === 0) return;

    // Load first snapshot summary to get asset list
    try {
        const firstDate = historicalIndex.snapshots[0].date;
        const response = await fetch(`archive/${firstDate}/summary.json`);
        if (response.ok) {
            const summary = await response.json();
            const assets = Object.keys(summary.assets || {}).slice(0, 20);

            // Add asset options
            for (const asset of assets) {
                const optValue = document.createElement('option');
                optValue.value = `value:${asset}`;
                optValue.textContent = `${asset} Value`;
                select.appendChild(optValue);

                const optQty = document.createElement('option');
                optQty.value = `qty:${asset}`;
                optQty.textContent = `${asset} Quantity`;
                select.appendChild(optQty);
            }
        }
    } catch (error) {
        console.log('Could not load asset list');
    }
}

// Load a historical snapshot
async function loadSnapshot(date) {
    if (date === 'current') {
        // Reload current data
        isViewingSnapshot = false;
        document.getElementById('snapshot-status').textContent = '';
        await loadData();
        processComparisonData();
        updateSummary();
        renderPieChart();
        renderKeyHoldings();
        renderCategoriesOverview();
        renderComparisonTable();
        renderWalletView();
        renderCategoryDetailView();
        return;
    }

    try {
        document.getElementById('snapshot-status').textContent = 'Loading...';

        const [zerionRes, debankRes] = await Promise.all([
            fetch(`archive/${date}/zerion.json`),
            fetch(`archive/${date}/debank.json`)
        ]);

        if (!zerionRes.ok || !debankRes.ok) {
            throw new Error('Snapshot not found');
        }

        zerionData = await zerionRes.json();
        debankData = await debankRes.json();
        isViewingSnapshot = true;

        processComparisonData();
        updateSummary();
        renderPieChart();
        renderKeyHoldings();
        renderCategoriesOverview();
        renderComparisonTable();
        renderWalletView();
        renderCategoryDetailView();

        document.getElementById('snapshot-status').textContent = `Viewing: ${date}`;
        document.getElementById('last-updated').textContent = date;
    } catch (error) {
        console.error('Error loading snapshot:', error);
        document.getElementById('snapshot-status').textContent = 'Error loading snapshot';
    }
}

// Render historical chart
async function renderHistoricalChart() {
    const canvas = document.getElementById('history-chart');
    if (!canvas || !historicalIndex || historicalIndex.snapshots.length === 0) {
        // Show placeholder message
        const container = canvas?.parentElement;
        if (container) {
            container.innerHTML = '<div class="chart-placeholder">Historical data will appear here after the first daily update runs.</div>';
        }
        return;
    }

    const ctx = canvas.getContext('2d');
    const chartType = document.getElementById('chart-asset-select')?.value || 'total';
    const timeframe = parseInt(document.getElementById('chart-timeframe')?.value || '30');

    // Get data points
    let snapshots = [...historicalIndex.snapshots].reverse(); // Oldest first
    if (timeframe !== 'all' && !isNaN(timeframe)) {
        snapshots = snapshots.slice(-timeframe);
    }

    if (snapshots.length === 0) return;

    // Load detailed data if needed for asset-specific charts
    let dataPoints = [];

    if (chartType === 'total') {
        dataPoints = snapshots.map(s => ({
            date: s.date,
            zerion: s.zerion_total,
            debank: s.debank_total
        }));
    } else if (chartType === 'nav') {
        dataPoints = snapshots.map(s => ({
            date: s.date,
            value: s.nav_per_gno
        }));
    } else if (chartType.startsWith('value:') || chartType.startsWith('qty:')) {
        const [type, asset] = chartType.split(':');
        // Need to load summary for each date
        for (const s of snapshots) {
            try {
                const res = await fetch(`archive/${s.date}/summary.json`);
                if (res.ok) {
                    const summary = await res.json();
                    const assetData = summary.assets?.[asset];
                    if (assetData) {
                        dataPoints.push({
                            date: s.date,
                            value: type === 'value' ? assetData.value : assetData.quantity
                        });
                    }
                }
            } catch (e) {
                console.log(`Could not load summary for ${s.date}`);
            }
        }
    }

    if (dataPoints.length === 0) return;

    // Draw chart
    drawLineChart(ctx, canvas, dataPoints, chartType);
}

// Draw line chart using Canvas
function drawLineChart(ctx, canvas, data, chartType) {
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 30, right: 80, bottom: 40, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    // Determine if dual series (total) or single series
    const isDual = chartType === 'total';

    // Get min/max values
    let allValues = [];
    if (isDual) {
        allValues = data.flatMap(d => [d.zerion, d.debank]);
    } else {
        allValues = data.map(d => d.value);
    }

    const minVal = Math.min(...allValues) * 0.95;
    const maxVal = Math.max(...allValues) * 1.05;
    const valueRange = maxVal - minVal || 1;

    // Helper to map value to Y coordinate
    const getY = (val) => padding.top + chartHeight - ((val - minVal) / valueRange) * chartHeight;
    const getX = (i) => padding.left + (i / (data.length - 1 || 1)) * chartWidth;

    // Draw grid lines
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        const val = maxVal - (i / 4) * valueRange;
        ctx.fillStyle = '#8b949e';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatChartValue(val, chartType), padding.left - 10, y + 4);
    }

    // Draw X-axis labels (dates)
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += labelStep) {
        const x = getX(i);
        ctx.fillStyle = '#8b949e';
        ctx.fillText(data[i].date.slice(5), x, height - padding.bottom + 20);
    }

    // Draw lines
    if (isDual) {
        // Zerion line (blue)
        drawLine(ctx, data, getX, getY, d => d.zerion, '#2962ff', 'Zerion');
        // DeBank line (orange)
        drawLine(ctx, data, getX, getY, d => d.debank, '#fe815f', 'DeBank');
    } else {
        // Single line (teal)
        drawLine(ctx, data, getX, getY, d => d.value, '#04795b', chartType.includes(':') ? chartType.split(':')[1] : 'Value');
    }

    // Update legend
    const legend = document.getElementById('chart-legend');
    if (legend) {
        if (isDual) {
            legend.innerHTML = `
                <span class="legend-item"><span class="legend-dot" style="background:#2962ff"></span>Zerion</span>
                <span class="legend-item"><span class="legend-dot" style="background:#fe815f"></span>DeBank</span>
            `;
        } else {
            legend.innerHTML = `
                <span class="legend-item"><span class="legend-dot" style="background:#04795b"></span>${chartType === 'nav' ? 'NAV per GNO' : chartType.split(':')[1]}</span>
            `;
        }
    }
}

// Draw a single line on the chart
function drawLine(ctx, data, getX, getY, getValue, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
        const x = getX(i);
        const y = getY(getValue(data[i]));
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw dots
    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
        const x = getX(i);
        const y = getY(getValue(data[i]));
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Format chart value for display
function formatChartValue(value, chartType) {
    if (chartType === 'nav') {
        return '$' + value.toFixed(2);
    } else if (chartType.startsWith('qty:')) {
        return formatQuantity(value);
    } else {
        return formatCurrency(value);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
