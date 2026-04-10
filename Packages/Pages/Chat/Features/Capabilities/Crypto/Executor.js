import { createExecutor } from '../Shared/createExecutor.js';
import { fmt, fmtBig, safeJson } from '../Shared/Utils.js';
import { toolsList } from './ToolsList.js';
import { resolveCoin, currencySymbol } from './Utils.js';

export const { handles, execute } = createExecutor({
  name: 'CryptoExecutor',
  tools: toolsList,
  handlers: {
    get_crypto_price: async (params, onStage) => {
      const { coin, vs_currency = 'usd' } = params;
      if (!coin)
        throw new Error('Missing required param: coin (e.g. "bitcoin", "ethereum", "BTC")');
      onStage(`🔍 Searching for ${coin}…`);

      const searchData = await safeJson(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(coin)}`,
      );
      const coinResult = searchData.coins?.[0];
      if (!coinResult) {
        return `Couldn't find cryptocurrency "${coin}". Try common names like "bitcoin", "ethereum", "solana", "dogecoin".`;
      }
      onStage(`📈 Loading market data for ${coinResult.name}…`);

      const currencies = [vs_currency, 'usd', 'eur', 'inr']
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(',');
      const priceData = await safeJson(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinResult.id}` +
          `&vs_currencies=${currencies}` +
          `&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`,
      );

      const d = priceData[coinResult.id];
      if (!d)
        return `Price data temporarily unavailable for "${coinResult.name}". Try again shortly.`;

      const change = d[`${vs_currency}_24h_change`]?.toFixed(2) ?? 'N/A';
      const changeDir = parseFloat(change) >= 0 ? '📈' : '📉';
      const changeLabel = parseFloat(change) >= 0 ? `+${change}%` : `${change}%`;
      const lastUpdated = d.last_updated_at
        ? new Date(d.last_updated_at * 1000).toLocaleString()
        : 'N/A';

      const lines = [
        `🪙 ${coinResult.name} (${coinResult.symbol.toUpperCase()})`,
        ``,
        `Price (${vs_currency.toUpperCase()}): ${fmt(d[vs_currency])} ${changeDir} ${changeLabel} (24h)`,
        `Market Cap: ${fmtBig(d[`${vs_currency}_market_cap`])}`,
        `24h Volume: ${fmtBig(d[`${vs_currency}_24h_vol`])}`,
      ];
      if (vs_currency !== 'usd' && d.usd) lines.push(`USD: $${fmt(d.usd)}`);
      if (vs_currency !== 'eur' && d.eur) lines.push(`EUR: €${fmt(d.eur)}`);
      if (vs_currency !== 'inr' && d.inr) lines.push(`INR: ₹${fmt(d.inr, 0)}`);
      lines.push(``, `Last updated: ${lastUpdated}`, `Source: CoinGecko`);
      return lines.join('\n');
    },

    get_crypto_trending: async (params, onStage) => {
      onStage(`🔥 Fetching trending coins…`);
      const data = await safeJson('https://api.coingecko.com/api/v3/search/trending');
      const trending = data.coins?.slice(0, 7) ?? [];
      if (!trending.length) return 'No trending coins data available right now.';
      const lines = trending.map((t, i) => {
        const c = t.item;
        return `${i + 1}. ${c.name} (${c.symbol}) — Rank #${c.market_cap_rank ?? '?'}`;
      });
      return `🔥 Trending on CoinGecko right now:\n\n${lines.join('\n')}\n\nSource: CoinGecko`;
    },

    get_coin_info: async (params, onStage) => {
      const { coin } = params;
      onStage(`🔍 Resolving ${coin}…`);
      const coinResult = await resolveCoin(coin);
      onStage(`📋 Fetching details for ${coinResult.name}…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/${coinResult.id}` +
          `?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
      );

      const d = data.description?.en?.replace(/<[^>]+>/g, '').slice(0, 300) ?? 'N/A';
      const homepage = data.links?.homepage?.[0] ?? 'N/A';
      const reddit = data.links?.subreddit_url ?? 'N/A';
      const twitter = data.links?.twitter_screen_name
        ? `https://twitter.com/${data.links.twitter_screen_name}`
        : 'N/A';
      const genesis = data.genesis_date ?? 'N/A';
      const algo = data.hashing_algorithm ?? 'N/A';
      const blockTime =
        data.block_time_in_minutes != null ? `${data.block_time_in_minutes} min` : 'N/A';
      const categories = data.categories?.filter(Boolean).slice(0, 5).join(', ') ?? 'N/A';

      return [
        `📋 ${data.name} (${data.symbol?.toUpperCase()})`,
        `Rank: #${data.market_cap_rank ?? '?'}`,
        ``,
        `Description: ${d}${d.length === 300 ? '…' : ''}`,
        ``,
        `Categories:   ${categories}`,
        `Genesis Date: ${genesis}`,
        `Algorithm:    ${algo}`,
        `Block Time:   ${blockTime}`,
        ``,
        `Website: ${homepage}`,
        `Reddit:  ${reddit}`,
        `Twitter: ${twitter}`,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_top_coins: async (params, onStage) => {
      const { limit = 10, vs_currency = 'usd' } = params;
      const n = Math.min(Number(limit) || 10, 50);
      onStage(`📊 Fetching top ${n} coins by market cap…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/markets` +
          `?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${n}&page=1` +
          `&sparkline=false&price_change_percentage=24h`,
      );

      if (!data?.length) return 'Market data unavailable right now.';
      const sym = currencySymbol(vs_currency);
      const lines = data.map((c, i) => {
        const change = c.price_change_percentage_24h?.toFixed(2) ?? 'N/A';
        const arrow = parseFloat(change) >= 0 ? '▲' : '▼';
        return `${String(i + 1).padStart(2)}. ${c.name.padEnd(18)} ${sym}${fmt(c.current_price).padStart(14)}  ${arrow} ${change}%  MCap: ${fmtBig(c.market_cap)}`;
      });

      return [
        `🏆 Top ${n} Coins by Market Cap (${vs_currency.toUpperCase()})`,
        ``,
        ...lines,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_coin_history: async (params, onStage) => {
      const { coin, date } = params;
      if (!date) throw new Error('Missing required param: date (DD-MM-YYYY)');
      onStage(`🔍 Resolving ${coin}…`);
      const coinResult = await resolveCoin(coin);
      onStage(`📅 Fetching historical data for ${coinResult.name} on ${date}…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/${coinResult.id}/history?date=${date}&localization=false`,
      );

      const p = data.market_data?.current_price;
      const mc = data.market_data?.market_cap;
      const vol = data.market_data?.total_volume;

      if (!p) return `No historical data found for ${coinResult.name} on ${date}.`;

      return [
        `📅 ${coinResult.name} (${coinResult.symbol.toUpperCase()}) — ${date}`,
        ``,
        `Price:      $${fmt(p.usd ?? 0)} USD  |  ₹${fmt(p.inr ?? 0, 0)} INR  |  €${fmt(p.eur ?? 0)} EUR`,
        `Market Cap: $${fmtBig(mc?.usd ?? 0)}`,
        `Volume:     $${fmtBig(vol?.usd ?? 0)}`,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_coin_market_chart: async (params, onStage) => {
      const { coin, days = 7, vs_currency = 'usd' } = params;
      onStage(`🔍 Resolving ${coin}…`);
      const coinResult = await resolveCoin(coin);
      onStage(`📈 Fetching ${days}-day chart for ${coinResult.name}…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/${coinResult.id}/market_chart` +
          `?vs_currency=${vs_currency}&days=${days}`,
      );

      const prices = data.prices ?? [];
      if (!prices.length) return 'Chart data unavailable right now.';

      const first = prices[0];
      const last = prices[prices.length - 1];
      const high = Math.max(...prices.map((p) => p[1]));
      const low = Math.min(...prices.map((p) => p[1]));
      const change = (((last[1] - first[1]) / first[1]) * 100).toFixed(2);
      const sym = currencySymbol(vs_currency);
      const arrow = parseFloat(change) >= 0 ? '📈' : '📉';

      return [
        `📊 ${coinResult.name} — Last ${days} Day(s) (${vs_currency.toUpperCase()})`,
        ``,
        `Start:  ${sym}${fmt(first[1])}  (${new Date(first[0]).toLocaleDateString()})`,
        `End:    ${sym}${fmt(last[1])}  (${new Date(last[0]).toLocaleDateString()})`,
        `Change: ${arrow} ${change}%`,
        `High:   ${sym}${fmt(high)}`,
        `Low:    ${sym}${fmt(low)}`,
        `Points: ${prices.length} data points`,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_coin_ohlc: async (params, onStage) => {
      const { coin, days = 7, vs_currency = 'usd' } = params;
      onStage(`🔍 Resolving ${coin}…`);
      const coinResult = await resolveCoin(coin);
      onStage(`🕯️ Fetching OHLC data for ${coinResult.name}…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/${coinResult.id}/ohlc` +
          `?vs_currency=${vs_currency}&days=${days}`,
      );

      if (!data?.length) return 'OHLC data unavailable right now.';

      const sym = currencySymbol(vs_currency);
      // Show last 5 candles
      const recent = data.slice(-5);
      const lines = recent.map(([ts, o, h, l, c]) => {
        const date = new Date(ts).toLocaleDateString();
        return `${date}  O:${sym}${fmt(o)}  H:${sym}${fmt(h)}  L:${sym}${fmt(l)}  C:${sym}${fmt(c)}`;
      });

      return [
        `🕯️ ${coinResult.name} OHLC — Last ${days} Day(s) (${vs_currency.toUpperCase()})`,
        `(Showing last ${recent.length} candles)`,
        ``,
        ...lines,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_global_market: async (params, onStage) => {
      onStage(`🌍 Fetching global crypto market stats…`);
      const data = await safeJson('https://api.coingecko.com/api/v3/global');
      const d = data.data;
      if (!d) return 'Global market data unavailable right now.';

      const btcDom = d.market_cap_percentage?.btc?.toFixed(2) ?? 'N/A';
      const ethDom = d.market_cap_percentage?.eth?.toFixed(2) ?? 'N/A';

      return [
        `🌍 Global Crypto Market`,
        ``,
        `Total Market Cap:  $${fmtBig(d.total_market_cap?.usd)}`,
        `24h Volume:        $${fmtBig(d.total_volume?.usd)}`,
        `BTC Dominance:     ${btcDom}%`,
        `ETH Dominance:     ${ethDom}%`,
        `Active Coins:      ${(d.active_cryptocurrencies ?? 0).toLocaleString()}`,
        `Markets:           ${(d.markets ?? 0).toLocaleString()}`,
        `Ongoing ICOs:      ${d.ongoing_icos ?? 'N/A'}`,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_defi_stats: async (params, onStage) => {
      onStage(`🏦 Fetching DeFi market overview…`);
      const data = await safeJson(
        'https://api.coingecko.com/api/v3/global/decentralized_finance_defi',
      );
      const d = data.data;
      if (!d) return 'DeFi data unavailable right now.';

      return [
        `🏦 DeFi Market Overview`,
        ``,
        `DeFi Market Cap:      $${fmtBig(parseFloat(d.defi_market_cap))}`,
        `ETH Market Cap:       $${fmtBig(parseFloat(d.eth_market_cap))}`,
        `DeFi / Eth Ratio:     ${parseFloat(d.defi_to_eth_ratio).toFixed(4)}`,
        `24h Trading Volume:   $${fmtBig(parseFloat(d.trading_volume_24h))}`,
        `DeFi Dominance:       ${parseFloat(d.defi_dominance).toFixed(2)}%`,
        `Top DeFi Coin:        ${d.top_coin_name} (${d.top_coin_defi_dominance?.toFixed(2)}% dominance)`,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_fear_greed_index: async (params, onStage) => {
      onStage(`😨 Fetching Fear & Greed Index…`);
      const data = await safeJson('https://api.alternative.me/fng/?limit=3&format=json');
      const items = data.data ?? [];
      if (!items.length) return 'Fear & Greed data unavailable right now.';

      const emojiMap = {
        'Extreme Fear': '😱',
        Fear: '😨',
        Neutral: '😐',
        Greed: '🤑',
        'Extreme Greed': '🚀',
      };

      const lines = items.map((item, i) => {
        const label = i === 0 ? 'Today   ' : i === 1 ? 'Yesterday' : '2 Days Ago';
        const emoji = emojiMap[item.value_classification] ?? '❓';
        return `${label}: ${item.value.padStart(3)} — ${emoji} ${item.value_classification}`;
      });

      return [`😨 Crypto Fear & Greed Index`, ``, ...lines, ``, `Source: alternative.me`].join(
        '\n',
      );
    },

    get_top_exchanges: async (params, onStage) => {
      const { limit = 10 } = params;
      const n = Math.min(Number(limit) || 10, 20);
      onStage(`🏛️ Fetching top ${n} exchanges…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/exchanges?per_page=${n}&page=1`,
      );

      if (!data?.length) return 'Exchange data unavailable right now.';
      const lines = data.map(
        (ex, i) =>
          `${String(i + 1).padStart(2)}. ${ex.name.padEnd(20)} Trust: ${ex.trust_score ?? 'N/A'}/10  Vol: $${fmtBig(ex.trade_volume_24h_btc * 40000)}  Country: ${ex.country ?? 'N/A'}`,
      );

      return [`🏛️ Top ${n} Exchanges`, ``, ...lines, ``, `Source: CoinGecko`].join('\n');
    },

    get_exchange_info: async (params, onStage) => {
      const { exchange_id } = params;
      if (!exchange_id) throw new Error('Missing required param: exchange_id');
      onStage(`🏛️ Fetching info for ${exchange_id}…`);

      const data = await safeJson(`https://api.coingecko.com/api/v3/exchanges/${exchange_id}`);

      if (data.error)
        return `Exchange "${exchange_id}" not found. Try slugs like "binance", "coinbase", "kraken".`;

      const desc = data.description?.replace(/<[^>]+>/g, '').slice(0, 250) ?? 'N/A';

      return [
        `🏛️ ${data.name}`,
        ``,
        `Country:      ${data.country ?? 'N/A'}`,
        `Year Est.:    ${data.year_established ?? 'N/A'}`,
        `Trust Score:  ${data.trust_score ?? 'N/A'} / 10`,
        `Trust Rank:   #${data.trust_score_rank ?? 'N/A'}`,
        `24h Vol (BTC): ₿${fmt(data.trade_volume_24h_btc)}`,
        `Has Trading Incentive: ${data.has_trading_incentive ? 'Yes' : 'No'}`,
        ``,
        `About: ${desc}${desc.length === 250 ? '…' : ''}`,
        ``,
        `URL: ${data.url ?? 'N/A'}`,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_coin_categories: async (params, onStage) => {
      onStage(`📂 Fetching coin categories…`);
      const data = await safeJson(
        'https://api.coingecko.com/api/v3/coins/categories?order=market_cap_desc',
      );

      if (!data?.length) return 'Category data unavailable right now.';
      const top = data.slice(0, 15);
      const lines = top.map((cat, i) => {
        const change = cat.market_cap_change_24h?.toFixed(2) ?? 'N/A';
        const arrow = parseFloat(change) >= 0 ? '▲' : '▼';
        return `${String(i + 1).padStart(2)}. ${cat.name.padEnd(35)} MCap: $${fmtBig(cat.market_cap)}  ${arrow} ${change}%`;
      });

      return [`📂 Top Coin Categories by Market Cap`, ``, ...lines, ``, `Source: CoinGecko`].join(
        '\n',
      );
    },

    get_coins_by_category: async (params, onStage) => {
      const { category_id, limit = 10 } = params;
      if (!category_id) throw new Error('Missing required param: category_id');
      const n = Math.min(Number(limit) || 10, 50);
      onStage(`📂 Fetching top coins in category "${category_id}"…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/markets` +
          `?vs_currency=usd&category=${category_id}&order=market_cap_desc&per_page=${n}&page=1&sparkline=false`,
      );

      if (!data?.length)
        return `No coins found for category "${category_id}". Check the category slug.`;
      const lines = data.map((c, i) => {
        const change = c.price_change_percentage_24h?.toFixed(2) ?? 'N/A';
        const arrow = parseFloat(change) >= 0 ? '▲' : '▼';
        return `${String(i + 1).padStart(2)}. ${c.name.padEnd(20)} $${fmt(c.current_price).padStart(14)}  ${arrow} ${change}%`;
      });

      return [`📂 Top ${n} Coins — ${category_id}`, ``, ...lines, ``, `Source: CoinGecko`].join(
        '\n',
      );
    },

    get_coin_tickers: async (params, onStage) => {
      const { coin } = params;
      onStage(`🔍 Resolving ${coin}…`);
      const coinResult = await resolveCoin(coin);
      onStage(`📡 Fetching trading pairs for ${coinResult.name}…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/${coinResult.id}/tickers?include_exchange_logo=false&page=1&depth=false&order=volume_desc`,
      );

      const tickers = data.tickers?.slice(0, 10) ?? [];
      if (!tickers.length) return `No trading pairs found for ${coinResult.name}.`;

      const lines = tickers.map(
        (t, i) =>
          `${String(i + 1).padStart(2)}. ${t.market?.name?.padEnd(18) ?? 'N/A'.padEnd(18)} ${(t.base + '/' + t.target).padEnd(12)}  Last: $${fmt(t.converted_last?.usd ?? 0)}  Vol: $${fmtBig(t.converted_volume?.usd ?? 0)}`,
      );

      return [
        `📡 Top Trading Pairs — ${coinResult.name} (${coinResult.symbol.toUpperCase()})`,
        ``,
        ...lines,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    convert_crypto: async (params, onStage) => {
      const { from_coin, to_coin, amount = 1 } = params;
      onStage(`🔄 Resolving ${from_coin} and ${to_coin}…`);

      const FIATS = ['usd', 'eur', 'inr', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'cny'];
      const fromFiat = FIATS.includes(from_coin.toLowerCase());
      const toFiat = FIATS.includes(to_coin.toLowerCase());

      let fromCoinId, fromName, toCoinId, toName;

      if (!fromFiat) {
        const r = await resolveCoin(from_coin);
        fromCoinId = r.id;
        fromName = `${r.name} (${r.symbol.toUpperCase()})`;
      } else {
        fromCoinId = null;
        fromName = from_coin.toUpperCase();
      }
      if (!toFiat) {
        const r = await resolveCoin(to_coin);
        toCoinId = r.id;
        toName = `${r.name} (${r.symbol.toUpperCase()})`;
      } else {
        toCoinId = null;
        toName = to_coin.toUpperCase();
      }

      onStage(`💱 Fetching prices…`);

      // Build the ids and vs_currencies for the price call
      const ids = [fromCoinId, toCoinId].filter(Boolean).join(',');
      const vsCurrencies = ['usd', ...FIATS].filter((v, i, a) => a.indexOf(v) === i).join(',');

      const priceData = await safeJson(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vsCurrencies}`,
      );

      // Get USD values of both sides
      let fromUsd, toUsd;

      if (fromFiat) {
        const fiatKey = from_coin.toLowerCase();
        // get USD per 1 unit of fromFiat (e.g. 1 INR = ? USD)
        // Use toCoinId price in fromFiat to calculate
        const toInFromFiat = priceData[toCoinId]?.[fiatKey];
        const toInUsd = priceData[toCoinId]?.usd;
        if (toInFromFiat == null || toInUsd == null) throw new Error('Price data unavailable.');
        const result = (amount / toInFromFiat) * 1; // amount fromFiat buys how many toCoin
        const toSym = currencySymbol(to_coin.toLowerCase());
        return `💱 ${fmt(amount)} ${fromName} = ${toSym}${fmt(result)} ${toName}\n\nSource: CoinGecko`;
      }

      if (toFiat) {
        const fiatKey = to_coin.toLowerCase();
        const fromInFiat = priceData[fromCoinId]?.[fiatKey];
        if (fromInFiat == null) throw new Error('Price data unavailable.');
        const result = amount * fromInFiat;
        const toSym = currencySymbol(fiatKey);
        return `💱 ${fmt(amount)} ${fromName} = ${toSym}${fmt(result, fiatKey === 'inr' ? 0 : 2)} ${toName}\n\nSource: CoinGecko`;
      }

      // Both crypto
      fromUsd = priceData[fromCoinId]?.usd;
      toUsd = priceData[toCoinId]?.usd;
      if (!fromUsd || !toUsd) throw new Error('Price data unavailable for one or both coins.');
      const result = (amount * fromUsd) / toUsd;

      return [
        `💱 Conversion`,
        ``,
        `${fmt(amount)} ${fromName}`,
        `= ${fmt(result)} ${toName}`,
        ``,
        `Rate: 1 ${fromName} = ${fmt(fromUsd / toUsd)} ${toName}`,
        `(via USD: 1 ${fromName} = $${fmt(fromUsd)})`,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_btc_exchange_rates: async (params, onStage) => {
      onStage(`₿ Fetching BTC exchange rates…`);
      const data = await safeJson('https://api.coingecko.com/api/v3/exchange_rates');
      const rates = data.rates ?? {};

      const featured = ['usd', 'eur', 'gbp', 'inr', 'jpy', 'aud', 'cad', 'eth', 'bnb', 'sol'];
      const lines = featured
        .filter((k) => rates[k])
        .map((k) => {
          const r = rates[k];
          return `${r.name.padEnd(20)} ${r.unit} ${fmt(r.value).padStart(16)} (${r.type})`;
        });

      return [`₿ Bitcoin Exchange Rates`, ``, ...lines, ``, `Source: CoinGecko`].join('\n');
    },

    get_trending_nfts: async (params, onStage) => {
      onStage(`🖼️ Fetching trending NFTs…`);
      const data = await safeJson('https://api.coingecko.com/api/v3/search/trending');
      const nfts = data.nfts?.slice(0, 7) ?? [];

      if (!nfts.length) return 'No trending NFT data available right now.';

      const lines = nfts.map(
        (n, i) =>
          `${i + 1}. ${n.name}  |  Floor: $${fmt(n.floor_price_in_native_currency ?? 0)}  |  24h: ${n.floor_price_24h_percentage_change?.toFixed(2) ?? 'N/A'}%`,
      );

      return [`🖼️ Trending NFT Collections`, ``, ...lines, ``, `Source: CoinGecko`].join('\n');
    },

    get_recently_added: async (params, onStage) => {
      onStage(`🆕 Fetching recently listed coins…`);
      // CoinGecko /coins/list doesn't give dates; use markets sorted by newest
      // The free endpoint doesn't expose listed_at reliably, so we use trending's new coins if available
      // Fallback: fetch lowest market_cap_rank coins (proxy for new)
      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/markets` +
          `?vs_currency=usd&order=id_asc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`,
      );

      // Actually use the search/trending endpoint which has nfts and categories but also coins
      const trending = await safeJson('https://api.coingecko.com/api/v3/search/trending');
      const newCoins = trending.coins?.slice(0, 10) ?? [];

      if (!newCoins.length) return 'Recently added data unavailable right now.';

      const lines = newCoins.map((t, i) => {
        const c = t.item;
        return `${i + 1}. ${c.name} (${c.symbol})  Rank: #${c.market_cap_rank ?? '?'}  Score: ${c.score ?? 'N/A'}`;
      });

      return [
        `🆕 Recently Trending / Newly Gaining Traction`,
        ``,
        ...lines,
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_gainers_losers: async (params, onStage) => {
      const { vs_currency = 'usd', limit = 5 } = params;
      const n = Math.min(Number(limit) || 5, 20);
      onStage(`🚀 Fetching top gainers and losers…`);

      // Fetch top 250 coins and sort by 24h change
      const data = await safeJson(
        `https://api.coingecko.com/api/v3/coins/markets` +
          `?vs_currency=${vs_currency}&order=market_cap_desc&per_page=250&page=1` +
          `&sparkline=false&price_change_percentage=24h`,
      );

      const valid = data.filter((c) => c.price_change_percentage_24h != null);
      const sorted = [...valid].sort(
        (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
      );
      const gainers = sorted.slice(0, n);
      const losers = sorted.slice(-n).reverse();

      const sym = currencySymbol(vs_currency);
      const fmtRow = (c, i) => {
        const change = c.price_change_percentage_24h.toFixed(2);
        return `${String(i + 1).padStart(2)}. ${c.name.padEnd(20)} ${sym}${fmt(c.current_price).padStart(12)}  ${change}%`;
      };

      return [
        `🚀 Top ${n} Gainers (24h)`,
        ``,
        ...gainers.map(fmtRow),
        ``,
        `📉 Top ${n} Losers (24h)`,
        ``,
        ...losers.map(fmtRow),
        ``,
        `Source: CoinGecko`,
      ].join('\n');
    },

    get_coin_dominance: async (params, onStage) => {
      onStage(`📊 Fetching market dominance…`);
      const data = await safeJson('https://api.coingecko.com/api/v3/global');
      const pct = data.data?.market_cap_percentage ?? {};

      const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
      const lines = sorted.map(
        ([symbol, dom], i) =>
          `${String(i + 1).padStart(2)}. ${symbol.toUpperCase().padEnd(8)} ${dom.toFixed(2)}%  ${'█'.repeat(Math.round(dom / 2))}`,
      );

      return [`📊 Crypto Market Dominance`, ``, ...lines, ``, `Source: CoinGecko`].join('\n');
    },

    search_crypto: async (params, onStage) => {
      const { query } = params;
      if (!query) throw new Error('Missing required param: query');
      onStage(`🔍 Searching for "${query}"…`);

      const data = await safeJson(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      );

      const coins = data.coins?.slice(0, 7) ?? [];
      const exchanges = data.exchanges?.slice(0, 3) ?? [];
      const nfts = data.nfts?.slice(0, 3) ?? [];

      const lines = [];

      if (coins.length) {
        lines.push(`🪙 Coins:`);
        coins.forEach((c, i) =>
          lines.push(
            `  ${i + 1}. ${c.name} (${c.symbol.toUpperCase()})  id: "${c.id}"  Rank: #${c.market_cap_rank ?? '?'}`,
          ),
        );
      }
      if (exchanges.length) {
        lines.push(``, `🏛️ Exchanges:`);
        exchanges.forEach((ex, i) => lines.push(`  ${i + 1}. ${ex.name}  id: "${ex.id}"`));
      }
      if (nfts.length) {
        lines.push(``, `🖼️ NFTs:`);
        nfts.forEach((n, i) => lines.push(`  ${i + 1}. ${n.name}  id: "${n.id}"`));
      }

      if (!lines.length) return `No results found for "${query}".`;

      return [`🔍 Search results for "${query}"`, ``, ...lines, ``, `Source: CoinGecko`].join('\n');
    },
  },
});
