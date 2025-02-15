/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { useState, useEffect } from 'react'
import { Grid, Box } from '@mui/material'
import { useSelector } from 'react-redux'

import { selectLoading, selectTokens, selectActiveNetworkName } from 'selectors'

import { logAmount } from 'util/amountConvert'

import { Pager } from 'components'
import Transaction from 'components/transaction/Transaction'

import * as S from './History.styles';

const PER_PAGE = 10

function TX_Deposits({ searchHistory, transactions }) {

  const [page, setPage] = useState(1)

  const loading = useSelector(selectLoading(['TRANSACTION/GETALL']))
  const tokenList = useSelector(selectTokens)
  const networkName = useSelector(selectActiveNetworkName())

  useEffect(() => {
    setPage(1)
  }, [searchHistory])

  let _deposits = transactions.filter(i => {
    return i.hash.includes(searchHistory) && i.to !== null && i.depositL2
  })
  // combine the batch onramp
  _deposits = _deposits.reduce((acc, cur) => {
    const index = acc.findIndex(i => i.blockNumber === cur.blockNumber)
    if (index !== -1) {
      acc[index].action = [...acc[index].action, cur.action]
    } else {
      cur.action = [cur.action]
      acc.push(cur)
    }
    return acc
  }, [])

  const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE);
  const endingIndex = page * PER_PAGE;
  const paginatedDeposits = _deposits.slice(startingIndex, endingIndex);

  let totalNumberOfPages = Math.ceil(_deposits.length / PER_PAGE);

  //if totalNumberOfPages === 0, set to one so we don't get the strange "page 1 of 0" display
  if (totalNumberOfPages === 0) totalNumberOfPages = 1

  return (
      <S.HistoryContainer>
        <Pager
          currentPage={page}
          isLastPage={paginatedDeposits.length < PER_PAGE}
          totalPages={totalNumberOfPages}
          onClickNext={()=>setPage(page + 1)}
          onClickBack={()=>setPage(page - 1)}
        />

        <Grid item xs={12}>
          <Box>
            <S.Content>
              {!paginatedDeposits.length && !loading && (
                <S.Disclaimer>Scanning for deposits...</S.Disclaimer>
              )}
              {!paginatedDeposits.length && loading && (
                <S.Disclaimer>Loading...</S.Disclaimer>
              )}
              {paginatedDeposits.map((i, index) => {
                const chain = (i.chain === 'L1pending') ? 'L1' : i.chain

                let details = null
                let amountTx = ''

                let metaData = ''

                if(i.crossDomainMessage.fast === 1) {
                  metaData = 'Fast Bridge'
                } else if (i.crossDomainMessage.fast === 0) {
                  metaData = 'Classic Bridge'
                }

                for (const payload of i.action) {
                  if (payload.token) {
                    const token = tokenList[payload.token.toLowerCase()];
                    if (!!token) {
                      let amount = logAmount(payload.amount, token.decimals, 3);
                      let symbol = token[`symbol${chain}`];
                      amountTx += `${amount} ${symbol} `;
                    }
                  }
                }

                if( i.crossDomainMessage && i.crossDomainMessage.l2BlockHash ) {
                  details = {
                    blockHash: i.crossDomainMessage.l2BlockHash,
                    blockNumber: i.crossDomainMessage.l2BlockNumber,
                    from: i.crossDomainMessage.l2From,
                    hash: i.crossDomainMessage.l2Hash,
                    to: i.crossDomainMessage.l2To,
                  }
                }

                return (
                  <Transaction
                    key={index}
                    title={`Hash: ${i.hash}`}
                    time={i.timeStamp}
                    blockNumber={`Block ${i.blockNumber}`}
                    chain={`${networkName['l1']} to ${networkName['l2']} ${i.activity === 'ClientDepositL1Batch' ? 'in Batch' : ''}`}
                    typeTX={`TX Type: ${metaData}`}
                    detail={details}
                    oriChain={chain}
                    oriHash={i.hash}
                    amountTx={amountTx}
                  />
                )
              })}
            </S.Content>
          </Box>
        </Grid>
      </S.HistoryContainer>
  );
}

export default React.memo(TX_Deposits)
