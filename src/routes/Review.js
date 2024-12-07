import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import axios from 'axios';
import Swal from "sweetalert2";

import styled from "styled-components";
import CommonTable from '../components/CommonTable';
import CommonTableColumn from '../components/CommonTableColumn';
import CommonTableRow from '../components/CommonTableRow';

import '../css/Review.scss';

const ITEMS_PER_PAGE = 10; // 페이지당 항목 수

const regular = `
  display: flex;
  flex-direction: column;
`

const ReviewDiv = styled.div`
  ${regular}
`

const BoardDiv = styled.div`
${regular}
  align-items: center;
  height: 75vh;
`

const WriteDiv = styled.div`
${regular}
  align-items: center;
  height: 20vh;
`

const ButtonDiv = styled.div`
  display: flex;
  justify-content: center;
`

const HOST = process.env.REACT_APP_HOST;
const PORT = process.env.REACT_APP_PORT;

const Review = () => {

  const [data, setData] = useState([]);
  const [writeTrue, setWriteTrue] = useState(false);
  const [writeData, setWriteData] = useState({
    title: '',
    content: ''
  });
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${HOST}:${PORT}/review/read`)
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
    axios.post(`${HOST}:${PORT}/review/write`, {
      title: "[사용자]" + writeData.title,
      content: writeData.content,
    }).then((res) => {
      setWriteData((prevState) => ({ ...prevState, title: '' }));
      setWriteData((prevState) => ({ ...prevState, content: '' }));
      Swal.fire({
        title: "알림",
        icon:'success',
        html: "리뷰가 완료되었습니다.",
        showCancelButton: false,
        confirmButtonText: "확인",
      }).then(() => {});
    }).catch((e) => { console.log("error"); });
    setWriteTrue(!writeTrue);
  }

  return (
    <ReviewDiv>
      <BoardDiv>
        <h1 className="Board-h1">Board</h1>
        {data.length > 0 ? (
          <>
            <CommonTable headersName={['[이용자 구분]제목', '내용', '작성 시기']}>
              {displayedData.map((item) => (
                <CommonTableRow key={item._id}>
                  <CommonTableColumn>{item.title}</CommonTableColumn>
                  <CommonTableColumn>{item.content}</CommonTableColumn>
                  <CommonTableColumn>{item.createdAt}</CommonTableColumn>
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
      </BoardDiv>

      <WriteDiv>
        {writeTrue && <>
          <h2>리뷰 작성하기</h2>
          제목<input onChange={(e) => setWriteData((prevState) => ({ ...prevState, title: e.target.value }))} required></input>
          글<textarea onChange={(e) => setWriteData((prevState) => ({ ...prevState, content: e.target.value }))} required></textarea>
        </>
        }
      </WriteDiv>


      <ButtonDiv>
        <button onClick={() => navigate("/")}>홈으로 가기</button>
        {writeTrue ? <>
          <button onClick={handleWriteReview}>저장하기</button>
          <button onClick={() => setWriteTrue(!writeTrue)}>취소하기</button></>
          :
          <button onClick={() => setWriteTrue(!writeTrue)}>글 작성하기</button>
        }
      </ButtonDiv>

    </ReviewDiv>
  )
}

export default Review;