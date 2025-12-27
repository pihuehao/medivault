// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title MedicalRecord
 * @author MediVault Team
 * @notice Privacy-preserving medical records using Fully Homomorphic Encryption
 * @dev Enables patients to store encrypted health metrics and control access
 *
 * Key Features:
 * - Health metrics are encrypted client-side before submission
 * - Only encrypted values are stored on-chain
 * - Per-metric permission control (Blood Pressure, Heart Rate, Glucose)
 * - Patients grant/revoke access to doctors, hospitals, insurers
 *
 * Permission Bitmask:
 * - Bit 0 (1): Blood Pressure
 * - Bit 1 (2): Heart Rate
 * - Bit 2 (4): Glucose Level
 * - All metrics (7): Full access
 */
contract MedicalRecord is ZamaEthereumConfig {
    // ============================================================
    //                         STORAGE
    // ============================================================

    struct HealthMetrics {
        euint32 bloodPressure;  // Systolic BP (e.g., 120)
        euint32 heartRate;      // BPM (e.g., 72)
        euint32 glucoseLevel;   // mg/dL (e.g., 95)
        uint256 lastUpdated;    // Timestamp of last update
        bool initialized;
    }

    // Metric bitmask constants
    uint8 private constant METRIC_BLOOD_PRESSURE = 1 << 0;  // 1
    uint8 private constant METRIC_HEART_RATE = 1 << 1;      // 2
    uint8 private constant METRIC_GLUCOSE = 1 << 2;         // 4
    uint8 private constant METRIC_ALL = METRIC_BLOOD_PRESSURE | METRIC_HEART_RATE | METRIC_GLUCOSE; // 7

    // patient => viewer => permission bitmask
    mapping(address => mapping(address => uint8)) private _permissions;

    // patient => encrypted health metrics
    mapping(address => HealthMetrics) private _records;

    // ============================================================
    //                          EVENTS
    // ============================================================

    /// @notice Emitted when a patient submits or updates their health metrics
    event RecordUpdated(address indexed patient, uint256 timestamp);

    /// @notice Emitted when permissions are granted or revoked
    event AccessChanged(
        address indexed patient,
        address indexed viewer,
        uint8 permissions
    );

    // ============================================================
    //                     WRITE FUNCTIONS
    // ============================================================

    /**
     * @notice Submit or update encrypted health metrics
     * @dev Encrypts metrics client-side before calling this function
     * @param encBloodPressure Encrypted systolic blood pressure
     * @param encHeartRate Encrypted heart rate in BPM
     * @param encGlucose Encrypted glucose level in mg/dL
     * @param inputProof Zama relayer input proof for verification
     */
    function submitRecord(
        externalEuint32 encBloodPressure,
        externalEuint32 encHeartRate,
        externalEuint32 encGlucose,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted values to internal format
        euint32 bloodPressure = FHE.fromExternal(encBloodPressure, inputProof);
        euint32 heartRate = FHE.fromExternal(encHeartRate, inputProof);
        euint32 glucose = FHE.fromExternal(encGlucose, inputProof);

        // Store encrypted health metrics
        _records[msg.sender] = HealthMetrics({
            bloodPressure: bloodPressure,
            heartRate: heartRate,
            glucoseLevel: glucose,
            lastUpdated: block.timestamp,
            initialized: true
        });

        // Grant ACL access to the contract and patient
        FHE.allowThis(_records[msg.sender].bloodPressure);
        FHE.allowThis(_records[msg.sender].heartRate);
        FHE.allowThis(_records[msg.sender].glucoseLevel);
        FHE.allow(_records[msg.sender].bloodPressure, msg.sender);
        FHE.allow(_records[msg.sender].heartRate, msg.sender);
        FHE.allow(_records[msg.sender].glucoseLevel, msg.sender);

        emit RecordUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Grant viewing permissions to a doctor/hospital/insurer
     * @dev Permissions are cumulative - calling with new mask updates the stored value
     * @param viewer Address to grant permissions to (doctor, hospital, etc.)
     * @param metricMask Bitmask of metrics (1=BP, 2=HR, 4=Glucose, 7=All)
     */
    function grantAccess(address viewer, uint8 metricMask) external {
        require(viewer != address(0), "Invalid viewer address");

        uint8 mask = metricMask & METRIC_ALL;
        _permissions[msg.sender][viewer] = mask;

        // If records exist, grant FHE ACL access for each permitted metric
        HealthMetrics storage r = _records[msg.sender];
        if (r.initialized) {
            if ((mask & METRIC_BLOOD_PRESSURE) != 0) {
                FHE.allow(r.bloodPressure, viewer);
            }
            if ((mask & METRIC_HEART_RATE) != 0) {
                FHE.allow(r.heartRate, viewer);
            }
            if ((mask & METRIC_GLUCOSE) != 0) {
                FHE.allow(r.glucoseLevel, viewer);
            }
        }

        emit AccessChanged(msg.sender, viewer, mask);
    }

    /**
     * @notice Revoke viewing permissions from an address
     * @dev FHE ACL cannot be revoked on existing ciphertexts, but new records
     *      will not include the revoked viewer in the allow list
     * @param viewer Address to revoke permissions from
     * @param metricMask Bitmask of metrics to revoke (use 7 to clear all)
     */
    function revokeAccess(address viewer, uint8 metricMask) external {
        uint8 mask = metricMask & METRIC_ALL;
        uint8 prev = _permissions[msg.sender][viewer];
        uint8 next = prev & (~mask);
        _permissions[msg.sender][viewer] = next;

        emit AccessChanged(msg.sender, viewer, next);
    }

    // ============================================================
    //                      READ FUNCTIONS
    // ============================================================

    /**
     * @notice Get encrypted health metric handles for a patient
     * @dev Returns zero handles if patient hasn't submitted records
     * @param patient Address to query records for
     * @return Tuple of (bloodPressure, heartRate, glucoseLevel) encrypted handles
     */
    function getRecord(address patient) external view returns (euint32, euint32, euint32) {
        HealthMetrics storage r = _records[patient];
        return (r.bloodPressure, r.heartRate, r.glucoseLevel);
    }

    /**
     * @notice Check if a patient has submitted health records
     * @param patient Address to check
     * @return True if the patient has initialized their health record
     */
    function hasRecord(address patient) external view returns (bool) {
        return _records[patient].initialized;
    }

    /**
     * @notice Get the last update timestamp for a patient's record
     * @param patient Address to check
     * @return Unix timestamp of last update (0 if no record)
     */
    function getLastUpdated(address patient) external view returns (uint256) {
        return _records[patient].lastUpdated;
    }

    /**
     * @notice Get the permission bitmask for a viewer
     * @param patient Address of the patient (record owner)
     * @param viewer Address of the potential viewer
     * @return Permission bitmask (0 = no access)
     */
    function getAccess(address patient, address viewer) external view returns (uint8) {
        return _permissions[patient][viewer];
    }
}
