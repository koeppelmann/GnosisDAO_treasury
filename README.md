# GnosisDAO Treasury Dashboard

A static web app comparing GnosisDAO treasury holdings from Zerion and DeBank APIs, with NAV per GNO calculation.

## Warning

**This project was vibecoded and comes without any guarantee of correctness.** The data, calculations, and code have not been formally audited or verified. Use at your own risk and always verify important financial information from primary sources.

## Features

- Compare treasury holdings across Zerion and DeBank APIs
- NAV per GNO calculation with option to exclude Gnosis Ltd. holdings
- Filter by asset category, position type, and match quality
- View holdings by wallet or by category

## Tracked Addresses

| Address | Description |
|---------|-------------|
| `0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f` | GNO Main Treasury |
| `0x849D52316331967b6fF1198e5E32A0eB168D039d` | Token Holdings (GNO, SAFE, COW) |
| `0x509Ad7278A2F6530Bc24590C83E93fAF8fd46E99` | Stables & Staking |
| `0xa5C629E04E563355c30885B62928fd6E03558548` | ETH Staking |
| `0x15a954001BB47890a4c46A7FE9f06F7c39fF3D68` | wstETH Primary |
| `0x4971DD016127F390a3EF6b956Ff944d0E2e1e462` | COW & Mixed |
| `0x9065A0F9545817d18b58436771b4d87Bda8f008B` | Aave Lending |
| `0x10E4597fF93cbee194F4879f8f1d54a370DB6969` | Gnosis Chain Treasury |
| `0x2923c1B5313F7375fdaeE80b7745106deBC1b53E` | LTF Holdings |
| `0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe` | COW Vesting |
| `0x5BE8aB1c28ee22Cdf9B136FEDa7D8f20876Bfc0F` | Gnosis Chain Stables |
| `0x689d4bd36bc1938Af5cA2673c3c753235e3b4D2b` | GNO Reserve |
| `0x399948eee21c5627Adb7De4A7EFe712245D48442` | Swarm (BZZ) |
| `0x45a09fabD540b54f499212B3f579f0cF3393Ab6b` | Swarm (BZZ) 2 |
| `0x7eEa4286E9e82ba332F49400D037609BB1Cf00DA` | GNO Small |
| `0x93EbF01356f44A1b0734081b0440bFf7bAcf72Ec` | Swarm (BZZ) 3 |
| `0x6bbe78ee9e474842dbd4ab4987b3cefe88426a92` | xDAI Operations |
| `0x0668792caF78D5bad6cD0B8EcE032dFA7C11aC60` | Swarm (BZZ) 4 |
| `0xCdF50be9061086e2eCfE6e4a1BF9164d43568EEC` | GNO Micro |
| `0x823A92aB789b15B88F43d798c332d6F38a32f0f6` | Swarm (BZZ) 5 |
| `0x813804d2D0820a6D8139946229BB840591bAEB47` | Empty Wallet |
| `0x2Bd0563e3e2C55edDaBe4E469a02cA6652fB9e4A` | Empty Wallet 2 |

### Excluded from NAV (optional)

| Address | Description |
|---------|-------------|
| `0x604e4557e9020841f4e8eb98148de3d3cdea350c` | Gnosis Ltd. GNO holdings |

## Data Updates

The data is static and must be manually refreshed by running the Python scripts (not included in repo for API key security).

## Links

- **Live Site:** https://koeppelmann.github.io/GnosisDAO_treasury/
- **GitHub:** https://github.com/koeppelmann/GnosisDAO_treasury
