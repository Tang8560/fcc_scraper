import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Transition from './Transition';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { GridRowModes, DataGrid, GridToolbarContainer, GridActionsCellItem, GridRowEditStopReasons } from '@mui/x-data-grid';

function EditToolbar({ setRows, setRowModesModel, rows }) {

  EditToolbar.propTypes = {
    setRows: PropTypes.func.isRequired,
    setRowModesModel: PropTypes.func.isRequired,
    rows: PropTypes.array.isRequired,
  };

  const handleClick = () => {
    const id = rows.length;
    setRows((oldRows) => [
      ...oldRows,
      { id, check: true, name: '' },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

function ModalInfo({ modalOpen, setModalOpen }) {

  ModalInfo.propTypes = {
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
  };

  const modalContent = useRef(null);
  const [rows, setRows] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({});
  //// [ Add Checkbox ]
  // const [selectionModel, setSelectionModel] = useState([]);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };
  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };
  const handleSaveClick = (id) => () => {
    setRows((oldRows) => {
      return oldRows.map((row) => {
        return {...row, name: row.name, id: row.id, };
      });
    });
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };
  const handleDeleteClick = (id) => () => {
    setRows(rows.filter((row) => row.id !== id));
  };
  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };
  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow };
    setRows((oldRows) => oldRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };
  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  //// [ Add Checkbox ]
  // const handleRowSelectionModelChange = (newSelectionModel) => {
  //   setRows((oldRows) =>
  //     oldRows.map((row) =>
  //       newSelectionModel.includes(row.id)
  //         ? { ...row, check: true }
  //         : { ...row, check: false }
  //     )
  //   );
  //   setSelectionModel(newSelectionModel);
  // };

  // 設定 Table 格式
  const columns = [
    { field: 'id', headerName: 'ID', width: 80, editable: false },
    { field: 'name', headerName: 'Name', width: 180, editable: true },
    { field: 'actions', type: 'actions', headerName: 'Actions', width: 180, cellClassName: 'actions', getActions: ({ id }) => getActions(id) },
  ];
  const getActions = (id) => {
    const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
    if (isInEditMode) {
      return [
        <GridActionsCellItem key={id} label="Save"   icon={<SaveIcon />} sx={{ color: 'primary.main' }} onClick={handleSaveClick(id)} />,
        <GridActionsCellItem key={id} label="Cancel" icon={<CancelIcon />} onClick={handleCancelClick(id)} />,
      ];
    }
    return [
      <GridActionsCellItem key={id} label="Edit" icon={<EditIcon />} onClick={handleEditClick(id)} />,
      <GridActionsCellItem key={id} label="Delete" icon={<DeleteIcon />} onClick={handleDeleteClick(id)} />,
    ];
  };
  // Fetch the data (simulating with a JSON file in Node.js)
  const fetchData = async () => {
    try {
      const response = await fetch("/fileKey.json");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const contentType = response.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response");
      }

      const jsonData = await response.json();
      if (Array.isArray(jsonData)) {
        setRows(jsonData);

        // 設置 selectionModel 為所有 `check: true` 的行
        console.log(jsonData);
        const defaultSelection = jsonData.filter(row => row.check).map(row => Number(row.id));
        //// [ Add Checkbox ]
        // console.log(defaultSelection);
        // setSelectionModel(defaultSelection);

        setRows(oldRows => oldRows.map(row => ({
          ...row,
          check: defaultSelection.includes(row.id)
        })));
      } else {
        throw new Error("Fetched data is not an array");
      }

    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please check the console for details.");
    }
  };
  const saveData = async () => {
    try {
      const response = await axios.post('http://localhost:3001/save-key', rows);
      if (response.data.success) {
        alert('Data saved successfully!');
      } else {
        throw new Error('Server reported failure in saving data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  // 讀取 JSON
  useEffect(() => {
    fetchData();
  }, []);

  // rows 更新時同步到 selectionModel
  //// [ Add Checkbox ]
  // useEffect(() => {
  //   const newSelectionModel = rows.filter(row => row.check).map(row => row.id);
  //   setSelectionModel(newSelectionModel);
  // }, [rows]);

  // 點擊視窗外或用ESC關閉對話框
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!modalOpen || modalContent.current.contains(target)) return;
      setModalOpen(false);
    };
    const keyHandler = ({ keyCode }) => {
      if (!modalOpen || keyCode !== 27) return;
      setModalOpen(false);
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('keydown', keyHandler);

    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [modalOpen, setModalOpen]);

  return (
    <>
      {/* Modal backdrop */}
      <Transition
        className="fixed inset-0 bg-slate-900 bg-opacity-30 z-50 transition-opacity"
        show={modalOpen}
        enter="transition ease-out duration-200"
        enterStart="opacity-0"
        enterEnd="opacity-100"
        leave="transition ease-out duration-100"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
        aria-hidden="true"
      />
      {/* Modal dialog */}
      <Transition
        className="fixed inset-0 z-50 overflow-auto flex items-start top-20 mb-4 justify-center px-4 sm:px-6"
        role="dialog"
        aria-modal="true"
        show={modalOpen}
        enter="transition ease-in-out duration-200"
        enterStart="opacity-0 translate-y-4"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-in-out duration-200"
        leaveStart="opacity-100 translate-y-0"
        leaveEnd="opacity-0 translate-y-4"
      >
        <div
          ref={modalContent}
          className="flex flex-col h-auto bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 overflow-auto max-w-2xl w-full max-h-full rounded shadow-lg"
        >
          <DataGrid
            rows={rows}
            columns={columns}
            columnHeaderHeight={50}
            hideFooter={true}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdate={(newRow) => processRowUpdate(newRow)}
            slots={{ toolbar: EditToolbar }}
            slotProps={{
              toolbar: { setRows, setRowModesModel, rows },
            }}
            //// [ Add Checkbox ]
            // checkboxSelection
            // selectionModel={selectionModel}
            // onRowSelectionModelChange={handleRowSelectionModelChange}
          />
          <button
            onClick={saveData}
            className=" m-5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Save Data
          </button>
        </div>
      </Transition>

    </>
  );
}

export default ModalInfo;
