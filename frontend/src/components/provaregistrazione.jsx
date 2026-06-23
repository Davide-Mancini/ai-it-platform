import { Modal, Button, Form } from "react-bootstrap";
import {  useState } from "react";
import { useDispatch } from "react-redux";
import { newUserAction } from "../redux/actions/newUserAction";

const ProvaRegistrazione = () => {
    const [show, setShow] = useState(false);
    const [nome,setNome]= useState("")
    const [cognome,setCognome]= useState("")
    const [email,setEmail]= useState("")
    const [password,setPassword]= useState("")
    const dispatch = useDispatch()
     const handleRegister = () => {
      dispatch(newUserAction(nome, cognome, email, password));
  };
   const handleShow = () => {
    setShow(true);
  };
  (
    <>
    <Button
        variant="outline-warning"
        className=" me-1 mt-3 border-3 rounded-pill fw-bold"
        onClick={handleShow}
      >
        Registrati
      </Button>
  <Modal show={show}>
    <Form>
      <Form.Group>
        <Form.Label>
          Nome
        </Form.Label>
        <Form.Control required type="text" autoFocus onChange={(e)=>{
          setNome(e.target)
        }}/>
        <Form.Label>
          Cognome
        </Form.Label>
        <Form.Control required type="text" autoFocus onChange={(e)=>{
          setCognome(e.target)
        }}/>
        <Form.Label>
          Email
        </Form.Label>
        <Form.Control required type="text" autoFocus onChange={(e)=>{
          setEmail(e.target)
        }}/>
        <Form.Label>
          Password
        </Form.Label>
        <Form.Control required type="text" autoFocus onChange={(e)=>{
          setPassword(e.target)
        }}/>
      </Form.Group>
    </Form>
    <Button
            className=" text-light fw-bold rounded-pill"
            variant="warning"
            type="submit"
            onClick={handleRegister}
          >
            Registrati
          </Button>
  </Modal>
    </>
  );
};
export default ProvaRegistrazione;
