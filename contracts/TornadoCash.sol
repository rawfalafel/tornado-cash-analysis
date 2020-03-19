pragma solidity 0.5.11;

interface TornadoCash {
  function changeOperator ( address _newOperator ) external;
  function nullifierHashes ( bytes32 ) external view returns ( bool );
  function withdraw ( bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _refund ) external payable;
  function verifier (  ) external view returns ( address );
  function hashLeftRight ( bytes32 _left, bytes32 _right ) external pure returns ( bytes32 );
  function FIELD_SIZE (  ) external view returns ( uint256 );
  function levels (  ) external view returns ( uint32 );
  function operator (  ) external view returns ( address );
  function isKnownRoot ( bytes32 _root ) external view returns ( bool );
  function commitments ( bytes32 ) external view returns ( bool );
  function denomination (  ) external view returns ( uint256 );
  function currentRootIndex (  ) external view returns ( uint32 );
  function updateVerifier ( address _newVerifier ) external;
  function isSpentArray ( bytes32[] calldata _nullifierHashes ) external view returns ( bool[] memory spent );
  function deposit ( bytes32 _commitment ) external payable;
  function getLastRoot (  ) external view returns ( bytes32 );
  function roots ( uint256 ) external view returns ( bytes32 );
  function ROOT_HISTORY_SIZE (  ) external view returns ( uint32 );
  function isSpent ( bytes32 _nullifierHash ) external view returns ( bool );
  function zeros ( uint256 ) external view returns ( bytes32 );
  function ZERO_VALUE (  ) external view returns ( uint256 );
  function filledSubtrees ( uint256 ) external view returns ( bytes32 );
  function nextIndex (  ) external view returns ( uint32 );

  event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
  event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee);
}
