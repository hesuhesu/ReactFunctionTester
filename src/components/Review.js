import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import styled from "styled-components";

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

const Review = () => {

    const [data, setData] = useState([]);
    const [write, setWrite] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {

    },[]);

    // 페이지 변경 핸들러
  const handlePageClick = (data) => {
    setCurrentPage(data.selected); // 현재 페이지 업데이트
  };

  // 현재 페이지에 해당하는 데이터
  const displayedData = data.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    return (
        <div>
            <Wrapper>
      <BoxOne />
      <BoxTwo />
    </Wrapper>
            {write && <div>
                <input></input>
                <textarea></textarea>
            </div>
            }
            {data.length > 0  && <>
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
            </>}
            <button onClick={()=>navigate("/")}>홈으로 가기</button>
            <button onClick={()=>setWrite(!write)}>{write ? '저장 완료' : '글 작성하기'}</button>
        </div>
    )
}

export default Review;