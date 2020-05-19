package mainincubator.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;


@Entity
@Table(name = "issuer")
public class Issuer extends AuditModel {
    @Id
    @GeneratedValue(generator = "issuer_generator")
    @SequenceGenerator(
            name = "issuer_generator",
            sequenceName = "issuer_sequence",
            initialValue = 1000
    )
    private Long id;

    @NotBlank
    @Size(min = 3, max = 100)
    private String name;

    private String address;

    @Column(columnDefinition = "text")
    private String longDescription;


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLongDescription() {
        return longDescription;
    }

    public void setDescription(String longDescription) {
        this.longDescription = longDescription;
    }

    public Issuer getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }


}
