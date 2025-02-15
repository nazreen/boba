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

import React, { useState } from 'react'

import { Typography, Fade, useMediaQuery, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import * as S from './Transaction.styles'

import truncate from 'truncate-middle'
import networkService from 'services/networkService'
import { formatDate } from 'util/dates'

function Transaction({
  time,
  timeLabel = null,
  chain,
  typeTX,
  blockNumber,
  detail,
  oriChain,
  oriHash,
  amountTx,
  completion = '',
  tx_ref = null,
  eventType,
  toChain,
}) {
  const [dropDownBox, setDropDownBox] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isNotFullScreen = useMediaQuery(theme.breakpoints.down(1920))

  const chainLink = ({ chain, hash }) => {
    const network = networkService.networkConfig
    if (!!network && !!network[chain]) {
      return `${network[chain].transaction}${hash}`
    }
    return ''
  }

  function renderDetailRedesign() {
    if (!detail) {
      return null
    }

    let prefix = 'L2'
    if (oriChain === 'L2') prefix = 'L1'

    return (
      <Fade in={dropDownBox}>
        <S.DropdownContent>
          <S.DropdownWrapper
          >
            <Typography
              variant="body3"
              color="fade"
              style={{
                fontSize: '0.7em',
              }}
            >
              {prefix} Hash:&nbsp;
              <a
                href={chainLink({ chain: prefix, hash: detail.hash })}
                target={'_blank'}
                rel="noopener noreferrer"
                style={{
                  color: theme.palette.mode === 'light' ? 'black' : 'white',
                  fontFamily: 'MessinaSB',
                  fontSize: '0.8em',
                }}
              >
                {isMobile ? truncate(detail.hash, 6, 6, '...') : detail.hash}
              </a>
            </Typography>

            <Typography
              variant="body3"
              color="fade"
              style={{
                fontSize: '0.7em'
              }}
            >
              {prefix} Block:&nbsp;{detail.blockNumber}
            </Typography>
            <Typography
              variant="body3"
              color="fade"
              style={{
                fontSize: '0.7em'
              }}
            >
              {prefix} Block Hash:&nbsp;
              <span style={{ fontFamily: 'MessinaSB', fontSize: '0.8em' }}>
                {detail.blockHash}
              </span>
            </Typography>
            <Typography
              variant="body3"
              color="fade"
              style={{
                fontSize: '0.7em'
              }}
            >
              {prefix} From:&nbsp;
              <span style={{ fontFamily: 'MessinaSB', fontSize: '0.8em' }}>
                {detail.from}
              </span>
            </Typography>
            <Typography
              variant="body3"
              color="fade"
              style={{
                fontSize: '0.7em'
              }}
            >
              {prefix} To:&nbsp;
              <span style={{ fontFamily: 'MessinaSB', fontSize: '0.8em' }}>
                {detail.to}
              </span>
            </Typography>
          </S.DropdownWrapper>
        </S.DropdownContent>
      </Fade>
    )
  }

  return (
    <S.Wrapper>
      <S.GridContainer
        container
        spacing={2}
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        minHeight={20}
      >
        <S.GridItemTag item xs={6} md={6}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              paddingLeft: '3px',
            }}
          >
            <Typography variant="caption" style={{ lineHeight: '1.1em' }}>
              {chain}
            </Typography>
            <Typography
              variant="body2"
              color="fade"
            >
              {timeLabel ? timeLabel : formatDate(time, 'lll')}
            </Typography>
            {completion === '' && (
              <Typography
                variant="body2"
                color="fade"
              >
                &nbsp;
              </Typography>
            )}
            {completion !== '' && (
              <Typography
                variant="body2"
                color="fade"
              >
                {completion}
              </Typography>
            )}
            {toChain && (
              <Typography
                variant="body2"
                color="fade"
              >
                {toChain}
              </Typography>
            )}
            <Typography
              variant="body2"
              color="fade"
              style={{
                fontSize: '0.7em',
              }}
            >
              {oriChain}&nbsp;Hash:&nbsp;
              <a
                href={
                  oriChain === 'L0'
                    ? tx_ref
                    : chainLink({ hash: oriHash, chain: oriChain })
                }
                target={'_blank'}
                rel="noopener noreferrer"
                style={{
                  color: theme.palette.mode === 'light' ? 'black' : 'white',
                  fontFamily: 'MessinaSB',
                }}
              >
                {isNotFullScreen ? truncate(oriHash, 6, 6, '...') : oriHash}
              </a>
            </Typography>
          </div>
        </S.GridItemTag>

        <S.GridItemTag item xs={3} md={3}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}
          >
            <Typography variant="body2" style={{ lineHeight: '1.1em' }}>
              {blockNumber}
            </Typography>
            <Typography
              variant="body2"
              color="fade"
            >
              {typeTX}
            </Typography>
            {eventType ? (
              <Typography
                variant="body2"
                color="fade"
              >
                {eventType}
              </Typography>
            ) : null}
            {amountTx ? (
              <Typography variant="body2" style={{ lineHeight: '1.1em' }}>
                {amountTx}
              </Typography>
            ) : null}
          </div>
        </S.GridItemTag>

        <S.GridItemTag item xs={3} md={3}>
          {!!detail && (
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                lineHeight: '1.1em',
              }}
              onClick={() => {
                setDropDownBox(!dropDownBox)
              }}
            >
              More Information{' '}
              <ExpandMoreIcon style={{ paddingBottom: '3px' }} />
            </Typography>
          )}
        </S.GridItemTag>
      </S.GridContainer>

      {dropDownBox ? renderDetailRedesign() : null}
    </S.Wrapper>
  )
}

export default Transaction
