import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptos } from './aptosClient';
import { MODULE_ADDRESS, MODULE_NAME } from './constants';
import { Layout, Plus, Minus, RefreshCcw, Loader2, Wallet } from 'lucide-react';

function App() {
  // Wallet state
  const { account, connect, disconnect, connected, signAndSubmitTransaction, wallets } = useWallet();
  
  // App state
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTxnLoading, setIsTxnLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the counter resource from the blockchain
   */
  const fetchCounter = async () => {
    if (!account) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const resource = await aptos.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::Counter`,
      });
      
      // The resource structure is { i: "string_number" }
      // Move u64 returns as string in JSON
      const val = (resource as any).i;
      setCount(parseInt(val));
    } catch (e: any) {
      // If resource not found, it means the counter hasn't been initialized yet
      if(e.status === 404 || JSON.stringify(e).includes("Resource not found")) {
        setCount(null);
      } else {
        console.error(e);
        setError("Failed to fetch counter.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data when account changes
  useEffect(() => {
    if (connected) {
      fetchCounter();
    } else {
      setCount(null);
    }
  }, [account, connected]);

  /**
   * Helper to execute entry functions
   */
  const executeTransaction = async (funcName: string, args: any[] = []) => {
    if (!account) return;
    setIsTxnLoading(true);
    setError(null);

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::${funcName}`,
          functionArguments: args,
        },
      });
      
      // Wait for transaction to be committed to blockchain
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      // Refresh UI
      await fetchCounter();
    } catch (err: any) {
      console.error(err);
      // User rejected or transaction failed
      setError(err.message || "Transaction failed");
    } finally {
      setIsTxnLoading(false);
    }
  };

  // Handlers mapping to Move Entry Functions
  const handleInitialize = () => executeTransaction("publish", [0]); // Initial value 0
  const handleIncrement = () => executeTransaction("increment", [account?.address]); // Spec requires address arg
  const handleDecrement = () => executeTransaction("decrement", [account?.address]); // Spec requires address arg
  const handleReset = () => executeTransaction("reset", []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="text-blue-400" /> 
            Aptos Counter
          </h1>
          {/* Connection Status Indicator */}
          <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
        </div>

        {/* Wallet Connection Section */}
        {!connected ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-6">Connect your wallet to interact with the Aptos blockchain.</p>
            {wallets?.map((wallet) => (
               <button
               key={wallet.name}
               onClick={() => connect(wallet.name)}
               className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
             >
               <Wallet className="w-5 h-5" />
               Connect {wallet.name}
             </button>
            ))}
            {(!wallets || wallets.length === 0) && (
               <p className="text-yellow-400 text-sm mt-4">No compatible wallets found. Please install Petra Wallet.</p>
            )}
          </div>
        ) : (
          /* Counter Interface Section */
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg">
               <span className="text-sm text-slate-400 font-mono">
                  {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
               </span>
               <button 
                 onClick={disconnect} 
                 className="text-xs text-red-400 hover:text-red-300"
               >
                 Disconnect
               </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded text-sm text-center">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
               <div className="py-12 flex justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               </div>
            ) : (
              <>
                {/* Not Initialized State */}
                {count === null ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 mb-4">No counter found for this account.</p>
                    <button
                      onClick={handleInitialize}
                      disabled={isTxnLoading}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isTxnLoading ? "Initializing..." : "Initialize Counter"}
                    </button>
                  </div>
                ) : (
                  /* Active Counter State */
                  <div className="text-center space-y-6">
                    <div className="py-8 bg-slate-900 rounded-xl border border-slate-700">
                      <span className="text-6xl font-mono font-bold tracking-tighter text-blue-400">
                        {count}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleDecrement}
                        disabled={isTxnLoading || count === 0}
                        className="flex items-center justify-center gap-2 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      
                      <button
                        onClick={handleIncrement}
                        disabled={isTxnLoading}
                        className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>

                    <button
                      onClick={handleReset}
                      disabled={isTxnLoading || count === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-sm"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Reset Counter
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;