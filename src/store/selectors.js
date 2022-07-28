import { createSelector } from 'reselect'
import { get, groupBy, reject, maxBy, minBy } from 'lodash';
import moment from 'moment'
import { ethers } from 'ethers';

const GREEN = '#25CE8F'
const RED = '#F45353'


const tokens = state => get(state, 'tokens.contracts')
const account = state => get(state, 'provider.account')

const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id === order.id)
    const orderCancelled = cancelled.some((o) => o.id === order.id)
    return(orderFilled || orderCancelled)
  })

  return openOrders

}

// My Open Orders
export const myOpenOrdersSelector = createSelector(
    account,
    tokens,
    openOrders,
    (account, tokens, orders) => {
        if (!tokens[0] || !tokens[1]) {return}

        // filter orders created by current account
        orders = orders.filter((order) => order.user === account)

        // Filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        // Decorate orders, add display attributes
        orders = decorateMyOpenOrders(orders, tokens)
        // Sort orders by date descending
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)

        return orders
    }
)
// plural
const decorateMyOpenOrders = (orders, tokens) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateMyOpenOrder(order, tokens)
            return (order)
        })
    )
}
// singular
const decorateMyOpenOrder = (order, tokens) => {
    let orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED)
    })
}

const decorateOrder = (order, tokens) => {
  let token0Amount, token1Amount

  // Note: DApp should be considered token0, mETH is considered token1
  // Example: Giving mETH in exchange for DApp
  if (order.tokenGive === tokens[1].address) {
    token0Amount = order.amountGive // The amount of DApp we are giving
    token1Amount = order.amountGet // The amount of mETH we want...
  } else {
    token0Amount = order.amountGet // The amount of DApp we want
    token1Amount = order.amountGive // The amount of mETH we are giving...
  }

  // Calculate token price to 5 decimal places
  const precision = 100000
  let tokenPrice = (token1Amount / token0Amount)
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return ({
    ...order,
    token1Amount: ethers.utils.formatUnits(token1Amount, "ether"),
    token0Amount: ethers.utils.formatUnits(token0Amount, "ether"),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D')
  })
}

// ALL FILLED ORDERS

export const filledOrdersSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) { return }

        // Filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // Sort orders by time ascending for price comparison
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)

        // decorate the orders
        orders = decorateFilledOrders(orders, tokens)

        // sort orders by descending data for display
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)

        return orders
    }
)
// plural
const decorateFilledOrders = (orders, tokens) => {
    // track the previous order to compare history
    let previousOrder = orders[0]

    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order // update the previous order once it's decorated
            return order
        })
    )
}
// singular
const decorateFilledOrder = (order, previousOrder) => {
    return({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    // show green price if only one order exists
    if (previousOrder.id === orderId)
    {
        return GREEN
    }

    // show green price if order price is equal or higher than previous order
    // show red price if order price is lower than previous order
    if (previousOrder.tokenPrice <= tokenPrice)
    {
        return GREEN
    }
    else
    {
        return RED
    }
}

// ------------------------------------------------------------------------------
// ORDER BOOK

export const orderBookSelector = createSelector(
  openOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) { return }

    // Filter orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

    // Decorate orders
    orders = decorateOrderBookOrders(orders, tokens)

    // Group orders by "orderType"
    orders = groupBy(orders, 'orderType')

    // Fetch buy orders
    const buyOrders = get(orders, 'buy', [])

    // Sort buy orders by token price
     orders = {
        ...orders,
        buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
      }

    // Fetch sell orders
    const sellOrders = get(orders, 'sell', [])

    // Sort sell orders by token price
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    return orders
  }
)

const decorateOrderBookOrders = (orders, tokens) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order, tokens)
      order = decorateOrderBookOrder(order, tokens)
      return(order)
    })
  )
}

const decorateOrderBookOrder = (order, tokens) => {
  const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
  })
}

// Price Chart
export const priceChartSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) {return}

        // Filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // sort orders by date ascending to compare history
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)

        orders = orders.map((order) => decorateOrder(order, tokens))

        // get last 2 orders for final price and price change
        let secondLastOrder, lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)

        const lastPrice = get(lastOrder, 'tokenPrice', 0)

        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

        return({
            lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [
                {
                    data: buildGraphData(orders)
                }
            ]
        })
    }
)

const buildGraphData = (orders) => {
    // group the orders by hour for the graph
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())
    // get each hour where data exists
    const hours = Object.keys(orders)
    // build the graph series
    const graphData = hours.map((hour) => {
        // fetch all orders from current hour
        const group = orders[hour]
        
        // calculate prices: open, high, low, close
        const open = group[0]
        const high = maxBy(group, 'tokenPrice')
        const low = minBy(group, 'tokenPrice')
        const close = group[group.length - 1] // last order

        return ({
            x: new Date(hour),
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })

    return graphData
}
