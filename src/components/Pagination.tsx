import allImgPaths from "@/assets";
import { memo } from "react";
import ReactPaginate from "react-paginate";

const Pagination = ({
  pageCount,
  currentPage,
  handlePageClick,
}: {
  pageCount: number;
  currentPage: number;
  handlePageClick: (page: any) => void;
}) => {
  return (
    <ReactPaginate
      className="border select-none border-[#ebebeb] rounded-[44px] flex items-center justify-end w-max ml-auto"
      nextLabel={<img src={allImgPaths.pagiRightArrow} className="w-6 h-6" />}
      previousLabel={
        <img src={allImgPaths.pagiLeftArrow} className="w-6 h-6" />
      }
      forcePage={currentPage}
      onPageChange={handlePageClick}
      pageRangeDisplayed={3}
      marginPagesDisplayed={1}
      pageCount={pageCount}
      pageClassName="page-item border-r border-[#ebebeb] h-full h-9 w-9 text-center"
      pageLinkClassName="page-link block flex justify-center px-[12px] py-[6px]"
      previousClassName="page-item border-r border-[#ebebeb] h-full text-center"
      previousLinkClassName="page-link block p-1"
      nextClassName="page-item border-r border-[#ebebeb] last:border-r-0 h-full h-9 w-9 text-center"
      nextLinkClassName="page-link block flex justify-center"
      breakLabel="..."
      breakClassName="page-item border-r border-[#ebebeb] h-full h-9 w-9 text-center"
      breakLinkClassName="page-link block px-[12px] py-[6px]"
      containerClassName="pagination"
      activeClassName="active bg-primary-900 page-item h-full h-9 w-9 text-center text-white"
      renderOnZeroPageCount={null}
    />
  );
};

export default memo(Pagination);
