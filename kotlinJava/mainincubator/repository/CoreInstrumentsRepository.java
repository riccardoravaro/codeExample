package mainincubator.repository;
package mainincubator.model;

import mainincubator.model.CoreInstruments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoreInstrumentsRepository extends JpaRepository<CoreInstruments, Long> {
}
