### Replacing Adapters
1. `trib manager-submitAndProcessProposal <name-of-adapter> <address-of-new-adapter>`
2. Which type of contract do you want to update? -> `Adapter`
3. Choose adapter and extension ACL's for new adapter
4. Input configs

### Updating Configs
1. `trib manager-submitAndProcessProposal manager 0x0000000000000000000000000000000000000000`
2. Which type of contract do you want to update? -> `Configs`
3. Input configs

### Get KYC Configs
- Get configs with new keys: `trib get-kyc-configs` 
- Get old configs: `trib get-kyc-configs useOldKeys`
