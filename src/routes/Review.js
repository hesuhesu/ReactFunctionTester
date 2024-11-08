import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import axios from 'axios';

import styled from "styled-components";
import CommonTable from '../components/CommonTable';
import CommonTableColumn from '../components/CommonTableColumn';
import CommonTableRow from '../components/CommonTableRow';

const ITEMS_PER_PAGE = 10; // 페이지당 항목 수

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 15vh;
`;

const BoxOne = styled.div`
  background-color: #cf6a87;
  width: 100px;
  height: 100px;
`;

const BoxTwo = styled.div`
  background-color: #574b90;
  width: 100px;
  height: 100px;
`;

const HOST = process.env.REACT_APP_HOST;
const PORT = process.env.REACT_APP_PORT;

const Review = () => {

  const [data, setData] = useState([]);
  const [write, setWrite] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${HOST}:${PORT}/board/all_board_list`)
      .then((response) => {
        setData(response.data.list);
        setPageCount(Math.ceil(response.data.list.length / ITEMS_PER_PAGE)); // 총 페이지 수 계산
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // 페이지 변경 핸들러
  const handlePageClick = (data) => {
    setCurrentPage(data.selected); // 현재 페이지 업데이트
  };

  // 현재 페이지에 해당하는 데이터
  const displayedData = data.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handleWriteReview = () => {
    if (write){
      axios.get(`${HOST}:${PORT}/board/all_board_list`)
      .then((response) => {
        setData(response.data.list);
        setPageCount(Math.ceil(response.data.list.length / ITEMS_PER_PAGE)); // 총 페이지 수 계산
      })
      .catch((error) => {
        console.error(error);
      });
    }
    setWrite(!write);
  }

  return (
    <div>
      <Wrapper>
        <BoxOne />
        <BoxTwo />
      </Wrapper>
      {write && <div>
        <h2>글 작성하기</h2>
        <input></input>
        <textarea></textarea>
      </div>
      }
      {data.length > 0 ? (
        <>
          <h1 className="Board-h1">Board</h1>
          <CommonTable headersName={['제목[클릭]', '내용', '작성자', '등록일']}>
            {displayedData.map((item) => (
              <CommonTableRow key={item._id}>
                <CommonTableColumn><Link to={`/board_detail/${item._id}`}>{item.title}</Link></CommonTableColumn>
                <CommonTableColumn><Link to={`/board_detail/${item._id}`}>{item.content}</Link></CommonTableColumn>
                <CommonTableColumn><Link to={`/board_detail/${item._id}`}>{item.writer}</Link></CommonTableColumn>
                <CommonTableColumn><Link to={`/board_detail/${item._id}`}>{item.createdAt}</Link></CommonTableColumn>
              </CommonTableRow>
            ))}
          </CommonTable>
          <ReactPaginate
            previousLabel={'이전'}
            nextLabel={'다음'}
            breakLabel={'...'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
        </>
      ) : <div>게시물 없음</div>}
      <button onClick={() => navigate("/")}>홈으로 가기</button>
      <button onClick={handleWriteReview}>{write ? '저장 완료' : '글 작성하기'}</button>
    </div>
  )
}

export default Review;